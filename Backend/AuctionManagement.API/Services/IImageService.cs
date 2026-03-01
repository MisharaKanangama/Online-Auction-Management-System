using AuctionManagement.API.Models;

namespace AuctionManagement.API.Services
{
    public interface IImageService
    {
        Task<List<AuctionImage>> UploadImagesAsync(int auctionId, List<IFormFile> files);
        Task<AuctionImage> UploadImageAsync(int auctionId, IFormFile file, bool isPrimary = false);
        Task<bool> DeleteImageAsync(int imageId);
        Task<List<AuctionImage>> GetAuctionImagesAsync(int auctionId);
        Task<string> GetImageUrlAsync(string fileName);
    }
}
