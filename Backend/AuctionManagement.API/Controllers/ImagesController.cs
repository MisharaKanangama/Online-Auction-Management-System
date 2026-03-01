using AuctionManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ImagesController : ControllerBase
    {
        private readonly IImageService _imageService;

        public ImagesController(IImageService imageService)
        {
            _imageService = imageService;
        }

        [HttpPost("upload/{auctionId}")]
        public async Task<IActionResult> UploadImages(int auctionId, [FromForm] List<IFormFile> files)
        {
            try
            {
                if (files == null || files.Count == 0)
                {
                    return BadRequest("No files provided");
                }

                if (files.Count > 10)
                {
                    return BadRequest("Maximum 10 images allowed per auction");
                }

                var uploadedImages = await _imageService.UploadImagesAsync(auctionId, files);
                return Ok(uploadedImages);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("upload-single/{auctionId}")]
        public async Task<IActionResult> UploadSingleImage(int auctionId, [FromForm] IFormFile file, [FromForm] bool isPrimary = false)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file provided");
                }

                var uploadedImage = await _imageService.UploadImageAsync(auctionId, file, isPrimary);
                return Ok(uploadedImage);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("auction/{auctionId}")]
        public async Task<IActionResult> GetAuctionImages(int auctionId)
        {
            try
            {
                var images = await _imageService.GetAuctionImagesAsync(auctionId);
                return Ok(images);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            try
            {
                var result = await _imageService.DeleteImageAsync(imageId);
                if (!result)
                {
                    return NotFound("Image not found");
                }

                return Ok(new { message = "Image deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
