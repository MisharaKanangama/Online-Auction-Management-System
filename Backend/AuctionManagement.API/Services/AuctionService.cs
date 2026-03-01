using AuctionManagement.API.Data;
using AuctionManagement.API.DTOs;
using AuctionManagement.API.Models;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AuctionManagement.API.Services
{
    public class AuctionService : IAuctionService
    {
        private readonly AuctionDbContext _context;
        private readonly IMapper _mapper;

        public AuctionService(AuctionDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<AuctionDto>> GetAllAuctionsAsync()
        {
            var auctions = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Include(a => a.Images)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return auctions.Select(MapToAuctionDto);
        }

        public async Task<IEnumerable<AuctionDto>> GetActiveAuctionsAsync()
        {
            var now = DateTime.Now;
            var auctions = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Include(a => a.Images)
                .Where(a => a.StartTime <= now && a.EndTime > now) // Use dynamic status logic
                .OrderBy(a => a.EndTime)
                .ToListAsync();

            return auctions.Select(MapToAuctionDto);
        }

        public async Task<IEnumerable<AuctionDto>> GetAuctionsByCategoryAsync(string category)
        {
            var auctions = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Include(a => a.Images)
                .Where(a => a.Category.ToLower() == category.ToLower())
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return auctions.Select(MapToAuctionDto);
        }

        public async Task<IEnumerable<AuctionDto>> GetAuctionsBySellerAsync(string sellerId)
        {
            var auctions = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Include(a => a.Images)
                .Where(a => a.SellerId == sellerId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return auctions.Select(MapToAuctionDto);
        }

        public async Task<AuctionDto?> GetAuctionByIdAsync(int id)
        {
            var auction = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Include(a => a.Images)
                .FirstOrDefaultAsync(a => a.Id == id);

            return auction != null ? MapToAuctionDto(auction) : null;
        }

        public async Task<AuctionDto> CreateAuctionAsync(CreateAuctionDto createAuctionDto, string sellerId)
        {
            // Validate auction dates
            var now = DateTime.Now;
            
            if (createAuctionDto.StartTime < now)
                throw new ArgumentException("Start time cannot be in the past");
            
            if (createAuctionDto.EndTime <= createAuctionDto.StartTime)
                throw new ArgumentException("End time must be after start time");
            
            if (createAuctionDto.EndTime <= now)
                throw new ArgumentException("End time cannot be in the past");

            // Determine initial status based on start time
            var initialStatus = createAuctionDto.StartTime <= now ? AuctionStatus.Active : AuctionStatus.Scheduled;

            var auction = new Auction
            {
                Title = createAuctionDto.Title,
                Description = createAuctionDto.Description,
                Category = createAuctionDto.Category,
                StartingBid = createAuctionDto.StartingBid,
                ReservePrice = createAuctionDto.ReservePrice,
                StartTime = createAuctionDto.StartTime,
                EndTime = createAuctionDto.EndTime,
                ImageUrl = createAuctionDto.ImageUrl,
                Condition = createAuctionDto.Condition,
                Location = createAuctionDto.Location,
                SellerId = sellerId,
                Status = initialStatus,
                CurrentBid = createAuctionDto.StartingBid
            };

            _context.Auctions.Add(auction);
            await _context.SaveChangesAsync();

            return await GetAuctionByIdAsync(auction.Id) ?? throw new InvalidOperationException("Failed to retrieve created auction");
        }

        public async Task<AuctionDto?> UpdateAuctionAsync(int id, UpdateAuctionDto updateAuctionDto, string userId)
        {
            var auction = await _context.Auctions.FirstOrDefaultAsync(a => a.Id == id && a.SellerId == userId);
            if (auction == null) return null;

            auction.Title = updateAuctionDto.Title;
            auction.Description = updateAuctionDto.Description;
            auction.Category = updateAuctionDto.Category;
            auction.StartingBid = updateAuctionDto.StartingBid;
            auction.ReservePrice = updateAuctionDto.ReservePrice;
            auction.StartTime = updateAuctionDto.StartTime;
            auction.EndTime = updateAuctionDto.EndTime;
            auction.ImageUrl = updateAuctionDto.ImageUrl;
            auction.Condition = updateAuctionDto.Condition;
            auction.Location = updateAuctionDto.Location;
            auction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetAuctionByIdAsync(id);
        }

        public async Task<bool> DeleteAuctionAsync(int id, string userId)
        {
            var auction = await _context.Auctions.FirstOrDefaultAsync(a => a.Id == id && a.SellerId == userId);
            if (auction == null) return false;

            _context.Auctions.Remove(auction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> StartAuctionAsync(int id, string userId)
        {
            var auction = await _context.Auctions.FirstOrDefaultAsync(a => a.Id == id && a.SellerId == userId);
            if (auction == null || auction.Status != AuctionStatus.Scheduled) return false;

            auction.Status = AuctionStatus.Active;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EndAuctionAsync(int id, string userId)
        {
            var auction = await _context.Auctions
                .Include(a => a.Bids)
                .FirstOrDefaultAsync(a => a.Id == id && a.SellerId == userId);

            if (auction == null || auction.Status != AuctionStatus.Active) return false;

            auction.Status = AuctionStatus.Ended;

            // Determine winner
            var winningBid = auction.Bids.OrderByDescending(b => b.Amount).FirstOrDefault();
            if (winningBid != null)
            {
                auction.WinnerId = winningBid.BidderId;
                auction.CurrentBid = winningBid.Amount;
                winningBid.IsWinningBid = true;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AuctionDto>> SearchAuctionsAsync(string searchTerm)
        {
            var auctions = await _context.Auctions
                .Include(a => a.Seller)
                .Include(a => a.Winner)
                .Include(a => a.Bids)
                .Where(a => a.Title.Contains(searchTerm) || 
                           a.Description.Contains(searchTerm) || 
                           a.Category.Contains(searchTerm))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return auctions.Select(MapToAuctionDto);
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync()
        {
            return await _context.Auctions
                .Select(a => a.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }

        public async Task<string?> GetFirstUserIdAsync()
        {
            var user = await _context.Users.FirstOrDefaultAsync();
            return user?.Id;
        }

        private AuctionDto MapToAuctionDto(Auction auction)
        {
            var now = DateTime.Now;
            var actualStatus = auction.Status;
            
            // Automatically determine status based on current time
            if (auction.Status == AuctionStatus.Scheduled && now >= auction.StartTime && now < auction.EndTime)
            {
                actualStatus = AuctionStatus.Active;
            }
            else if (auction.Status == AuctionStatus.Active && now >= auction.EndTime)
            {
                actualStatus = AuctionStatus.Ended;
            }
            
            TimeSpan? timeRemaining = null;
            if (actualStatus == AuctionStatus.Active && auction.EndTime > now)
            {
                timeRemaining = auction.EndTime - now;
            }

            return new AuctionDto
            {
                Id = auction.Id,
                Title = auction.Title,
                Description = auction.Description,
                Category = auction.Category,
                StartingBid = auction.StartingBid,
                ReservePrice = auction.ReservePrice,
                CurrentBid = auction.CurrentBid,
                StartTime = auction.StartTime,
                EndTime = auction.EndTime,
                Status = actualStatus,
                ImageUrl = auction.ImageUrl,
                Condition = auction.Condition,
                Location = auction.Location,
                SellerId = auction.SellerId,
                WinnerId = auction.WinnerId,
                CreatedAt = auction.CreatedAt,
                UpdatedAt = auction.UpdatedAt,
                SellerName = auction.Seller?.FullName ?? "Unknown",
                WinnerName = auction.Winner?.FullName,
                BidCount = auction.Bids.Count,
                TimeRemaining = timeRemaining?.ToString(@"dd\.hh\:mm\:ss"),
                Images = auction.Images?.Select(img => new AuctionImageDto
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
        }
    }
}
