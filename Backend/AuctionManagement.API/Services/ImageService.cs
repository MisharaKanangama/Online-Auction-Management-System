using AuctionManagement.API.Data;
using AuctionManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AuctionManagement.API.Services
{
    public class ImageService : IImageService
    {
        private readonly AuctionDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly string _uploadPath;
        private readonly string _baseUrl;

        public ImageService(AuctionDbContext context, IWebHostEnvironment environment, IConfiguration configuration)
        {
            _context = context;
            _environment = environment;
            _configuration = configuration;
            _uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "auctions");
            _baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5000";
            
            // Ensure upload directory exists
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

        public async Task<List<AuctionImage>> UploadImagesAsync(int auctionId, List<IFormFile> files)
        {
            var uploadedImages = new List<AuctionImage>();
            var isFirstImage = true;

            foreach (var file in files)
            {
                var image = await UploadImageAsync(auctionId, file, isFirstImage);
                uploadedImages.Add(image);
                isFirstImage = false;
            }

            return uploadedImages;
        }

        public async Task<AuctionImage> UploadImageAsync(int auctionId, IFormFile file, bool isPrimary = false)
        {
            // Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided");

            if (file.Length > 10 * 1024 * 1024) // 10MB limit
                throw new ArgumentException("File size exceeds 10MB limit");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
                throw new ArgumentException("Invalid file type. Only JPG, PNG, GIF, and WebP are allowed");

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create thumbnail (optional - you can implement this later)
            var thumbnailUrl = await CreateThumbnailAsync(filePath, fileName);

            // Create database record
            var auctionImage = new AuctionImage
            {
                AuctionId = auctionId,
                ImageUrl = GetImageUrlAsync(fileName).Result,
                ThumbnailUrl = thumbnailUrl,
                FileName = fileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                IsPrimary = isPrimary,
                DisplayOrder = await GetNextDisplayOrderAsync(auctionId)
            };

            _context.AuctionImages.Add(auctionImage);
            await _context.SaveChangesAsync();

            return auctionImage;
        }

        public async Task<bool> DeleteImageAsync(int imageId)
        {
            var image = await _context.AuctionImages.FindAsync(imageId);
            if (image == null)
                return false;

            // Delete physical file
            var filePath = Path.Combine(_uploadPath, image.FileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            // Delete thumbnail if exists
            if (!string.IsNullOrEmpty(image.ThumbnailUrl))
            {
                var thumbnailFileName = Path.GetFileName(image.ThumbnailUrl);
                var thumbnailPath = Path.Combine(_uploadPath, "thumbnails", thumbnailFileName);
                if (File.Exists(thumbnailPath))
                {
                    File.Delete(thumbnailPath);
                }
            }

            // Delete database record
            _context.AuctionImages.Remove(image);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<AuctionImage>> GetAuctionImagesAsync(int auctionId)
        {
            return await _context.AuctionImages
                .Where(i => i.AuctionId == auctionId)
                .OrderBy(i => i.DisplayOrder)
                .ThenBy(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<string> GetImageUrlAsync(string fileName)
        {
            return $"{_baseUrl}/uploads/auctions/{fileName}";
        }

        private async Task<string?> CreateThumbnailAsync(string originalPath, string fileName)
        {
            try
            {
                // Create thumbnails directory
                var thumbnailsPath = Path.Combine(_uploadPath, "thumbnails");
                if (!Directory.Exists(thumbnailsPath))
                {
                    Directory.CreateDirectory(thumbnailsPath);
                }

                var thumbnailFileName = $"thumb_{fileName}";
                var thumbnailPath = Path.Combine(thumbnailsPath, thumbnailFileName);

                // Copy the original image to create a thumbnail
                // For now, we'll just copy the original image as a thumbnail
                // In a production environment, you would resize the image here
                File.Copy(originalPath, thumbnailPath, true);

                return await GetImageUrlAsync($"thumbnails/{thumbnailFileName}");
            }
            catch
            {
                return null;
            }
        }

        private async Task<int> GetNextDisplayOrderAsync(int auctionId)
        {
            var maxOrder = await _context.AuctionImages
                .Where(i => i.AuctionId == auctionId)
                .MaxAsync(i => (int?)i.DisplayOrder) ?? 0;
            
            return maxOrder + 1;
        }
    }
}
