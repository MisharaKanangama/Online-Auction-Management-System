using AuctionManagement.API.DTOs;
using AuctionManagement.API.Models;

namespace AuctionManagement.API.Services
{
    public interface IAuctionService
    {
        Task<IEnumerable<AuctionDto>> GetAllAuctionsAsync();
        Task<IEnumerable<AuctionDto>> GetActiveAuctionsAsync();
        Task<IEnumerable<AuctionDto>> GetAuctionsByCategoryAsync(string category);
        Task<IEnumerable<AuctionDto>> GetAuctionsBySellerAsync(string sellerId);
        Task<AuctionDto?> GetAuctionByIdAsync(int id);
        Task<AuctionDto> CreateAuctionAsync(CreateAuctionDto createAuctionDto, string sellerId);
        Task<AuctionDto?> UpdateAuctionAsync(int id, UpdateAuctionDto updateAuctionDto, string userId);
        Task<bool> DeleteAuctionAsync(int id, string userId);
        Task<bool> StartAuctionAsync(int id, string userId);
        Task<bool> EndAuctionAsync(int id, string userId);
        Task<IEnumerable<AuctionDto>> SearchAuctionsAsync(string searchTerm);
        Task<IEnumerable<string>> GetCategoriesAsync();
        Task<string?> GetFirstUserIdAsync();
    }
}
