using AuctionManagement.API.Data;
using AuctionManagement.API.DTOs;
using AuctionManagement.API.Models;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using AuctionManagement.API.Hubs;

namespace AuctionManagement.API.Services
{
    public class BidService : IBidService
    {
        private readonly AuctionDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHubContext<AuctionHub> _hubContext;

        public BidService(AuctionDbContext context, IMapper mapper, IHubContext<AuctionHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        public async Task<IEnumerable<BidDto>> GetBidsByAuctionAsync(int auctionId)
        {
            try
            {
                var bids = await _context.Bids
                    .Include(b => b.Bidder)
                    .Where(b => b.AuctionId == auctionId)
                    .ToListAsync();

                // Order by amount on the client side to avoid SQLite decimal ordering issue
                return bids
                    .OrderByDescending(b => b.Amount)
                    .Select(MapToBidDto);
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                Console.WriteLine($"Error in GetBidsByAuctionAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<IEnumerable<BidDto>> GetBidsByUserAsync(string userId)
        {
            var bids = await _context.Bids
                .Include(b => b.Bidder)
                .Include(b => b.Auction)
                .Where(b => b.BidderId == userId)
                .ToListAsync();

            // Order by bid time on the client side
            return bids
                .OrderByDescending(b => b.BidTime)
                .Select(MapToBidDto);
        }

        public async Task<BidDto?> GetHighestBidAsync(int auctionId)
        {
            var bids = await _context.Bids
                .Include(b => b.Bidder)
                .Where(b => b.AuctionId == auctionId)
                .ToListAsync();

            // Order by amount on the client side and get the highest bid
            var highestBid = bids
                .OrderByDescending(b => b.Amount)
                .FirstOrDefault();

            return highestBid != null ? MapToBidDto(highestBid) : null;
        }

        public async Task<BidDto> PlaceBidAsync(CreateBidDto createBidDto, string bidderId)
        {
            // Validate auction exists and is active
            var auction = await _context.Auctions
                .Include(a => a.Bids)
                .FirstOrDefaultAsync(a => a.Id == createBidDto.AuctionId);

            if (auction == null)
                throw new ArgumentException("Auction not found");

            // Check if auction is actually active based on current time
            var now = DateTime.Now;
            
            // Use local time for comparison - no UTC conversion
            var isActive = auction.StartTime <= now && auction.EndTime > now;
            
            if (!isActive)
            {
                if (auction.StartTime > now)
                    throw new InvalidOperationException($"Auction has not started yet. Starts at {auction.StartTime:yyyy-MM-dd HH:mm:ss}");
                else
                    throw new InvalidOperationException($"Auction has ended. Ended at {auction.EndTime:yyyy-MM-dd HH:mm:ss}");
            }

            if (auction.SellerId == bidderId)
                throw new InvalidOperationException("Cannot bid on your own auction");

            // Validate bid amount
            var highestBid = auction.Bids.OrderByDescending(b => b.Amount).FirstOrDefault();
            var minimumBid = highestBid?.Amount + 1 ?? auction.StartingBid;

            if (createBidDto.Amount < minimumBid)
                throw new InvalidOperationException($"Bid must be at least ${minimumBid}");

            // Create new bid
            var bid = new Bid
            {
                AuctionId = createBidDto.AuctionId,
                BidderId = bidderId,
                Amount = createBidDto.Amount,
                Comment = createBidDto.Comment,
                BidTime = DateTime.Now
            };

            _context.Bids.Add(bid);

            // Update auction current bid
            auction.CurrentBid = createBidDto.Amount;
            auction.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            var createdBid = await GetBidByIdAsync(bid.Id) ?? throw new InvalidOperationException("Failed to retrieve created bid");
            
            // Broadcast the new bid to all clients watching this auction
            await _hubContext.Clients.Group($"Auction_{createBidDto.AuctionId}").SendAsync("NewBid", createdBid);
            
            // Also broadcast updated auction data (current bid, bid count, etc.)
            var updatedAuction = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Include(a => a.Images)
                .FirstOrDefaultAsync(a => a.Id == createBidDto.AuctionId);
            
            if (updatedAuction != null)
            {
                // Map to DTO for broadcasting
                var auctionDto = new AuctionDto
                {
                    Id = updatedAuction.Id,
                    Title = updatedAuction.Title,
                    Description = updatedAuction.Description,
                    Category = updatedAuction.Category,
                    StartingBid = updatedAuction.StartingBid,
                    ReservePrice = updatedAuction.ReservePrice,
                    CurrentBid = updatedAuction.CurrentBid,
                    StartTime = updatedAuction.StartTime,
                    EndTime = updatedAuction.EndTime,
                    Status = updatedAuction.StartTime <= DateTime.Now && updatedAuction.EndTime > DateTime.Now ? AuctionStatus.Active : updatedAuction.Status,
                    ImageUrl = updatedAuction.ImageUrl,
                    Condition = updatedAuction.Condition,
                    Location = updatedAuction.Location,
                    SellerId = updatedAuction.SellerId,
                    WinnerId = updatedAuction.WinnerId,
                    CreatedAt = updatedAuction.CreatedAt,
                    UpdatedAt = updatedAuction.UpdatedAt,
                    SellerName = updatedAuction.Seller?.FullName ?? "Unknown",
                    WinnerName = updatedAuction.Winner?.FullName,
                    BidCount = updatedAuction.Bids.Count,
                    TimeRemaining = updatedAuction.StartTime <= DateTime.Now && updatedAuction.EndTime > DateTime.Now 
                        ? (updatedAuction.EndTime - DateTime.Now).ToString(@"dd\.hh\:mm\:ss") 
                        : null,
                    Images = updatedAuction.Images?.Select(img => new AuctionImageDto
                    {
                        Id = img.Id,
                        AuctionId = img.AuctionId,
                        ImageUrl = img.ImageUrl,
                        ThumbnailUrl = img.ThumbnailUrl,
                        FileName = img.FileName,
                        ContentType = img.ContentType,
                        FileSize = img.FileSize,
                        DisplayOrder = img.DisplayOrder,
                        IsPrimary = img.IsPrimary,
                        CreatedAt = img.CreatedAt
                    }).ToList()
                };
                
                await _hubContext.Clients.Group($"Auction_{createBidDto.AuctionId}").SendAsync("AuctionUpdated", auctionDto);
            }

            return createdBid;
        }

        public async Task<bool> RetractBidAsync(int bidId, string userId)
        {
            var bid = await _context.Bids
                .Include(b => b.Auction)
                .FirstOrDefaultAsync(b => b.Id == bidId && b.BidderId == userId);

            if (bid == null) return false;

            if (bid.Auction.Status != AuctionStatus.Active)
                return false; // Cannot retract bid from inactive auction

            _context.Bids.Remove(bid);

            // Update auction current bid if this was the highest bid
            var auction = bid.Auction;
            var remainingBids = await _context.Bids
                .Where(b => b.AuctionId == auction.Id)
                .OrderByDescending(b => b.Amount)
                .ToListAsync();

            auction.CurrentBid = remainingBids.FirstOrDefault()?.Amount ?? auction.StartingBid;
            auction.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<BidHistoryDto>> GetBidHistoryByUserAsync(string userId)
        {
            var userBids = await _context.Bids
                .Include(b => b.Auction)
                .Include(b => b.Bidder)
                .Where(b => b.BidderId == userId)
                .GroupBy(b => b.AuctionId)
                .ToListAsync();

            var bidHistory = new List<BidHistoryDto>();

            foreach (var group in userBids)
            {
                var auction = group.First().Auction;
                var bids = group.OrderByDescending(b => b.Amount).ToList();

                bidHistory.Add(new BidHistoryDto
                {
                    AuctionId = auction.Id,
                    AuctionTitle = auction.Title,
                    Bids = bids.Select(MapToBidDto).ToList()
                });
            }

            return bidHistory.OrderByDescending(bh => bh.Bids.First().BidTime);
        }

        private async Task<BidDto?> GetBidByIdAsync(int id)
        {
            var bid = await _context.Bids
                .Include(b => b.Bidder)
                .FirstOrDefaultAsync(b => b.Id == id);

            return bid != null ? MapToBidDto(bid) : null;
        }

        public async Task<string?> GetFirstUserIdAsync()
        {
            var user = await _context.Users.FirstOrDefaultAsync();
            return user?.Id;
        }

        public async Task<string?> GetSecondUserIdAsync()
        {
            var users = await _context.Users.Take(2).ToListAsync();
            return users.Count >= 2 ? users[1].Id : null;
        }

        private BidDto MapToBidDto(Bid bid)
        {
            return new BidDto
            {
                Id = bid.Id,
                AuctionId = bid.AuctionId,
                BidderId = bid.BidderId,
                BidderName = bid.Bidder?.FullName ?? "Unknown",
                Amount = bid.Amount,
                BidTime = bid.BidTime,
                Comment = bid.Comment,
                IsWinningBid = bid.IsWinningBid
            };
        }
    }
}
