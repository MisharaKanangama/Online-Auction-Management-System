using AuctionManagement.API.DTOs;

namespace AuctionManagement.API.Services
{
    public interface IBidService
    {
        Task<IEnumerable<BidDto>> GetBidsByAuctionAsync(int auctionId);
        Task<IEnumerable<BidDto>> GetBidsByUserAsync(string userId);
        Task<BidDto?> GetHighestBidAsync(int auctionId);
        Task<BidDto> PlaceBidAsync(CreateBidDto createBidDto, string bidderId);
        Task<bool> RetractBidAsync(int bidId, string userId);
        Task<IEnumerable<BidHistoryDto>> GetBidHistoryByUserAsync(string userId);
        Task<string?> GetFirstUserIdAsync();
        Task<string?> GetSecondUserIdAsync();
    }
}
