using AuctionManagement.API.DTOs;
using AuctionManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuctionsController : ControllerBase
    {
        private readonly IAuctionService _auctionService;

        public AuctionsController(IAuctionService auctionService)
        {
            _auctionService = auctionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuctionDto>>> GetAuctions()
        {
            var auctions = await _auctionService.GetAllAuctionsAsync();
            return Ok(auctions);
        }

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<AuctionDto>>> GetActiveAuctions()
        {
            var auctions = await _auctionService.GetActiveAuctionsAsync();
            return Ok(auctions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AuctionDto>> GetAuction(int id)
        {
            var auction = await _auctionService.GetAuctionByIdAsync(id);
            return auction != null ? Ok(auction) : NotFound();
        }

        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<AuctionDto>>> GetAuctionsByCategory(string category)
        {
            var auctions = await _auctionService.GetAuctionsByCategoryAsync(category);
            return Ok(auctions);
        }

        [HttpGet("seller/{sellerId}")]
        public async Task<ActionResult<IEnumerable<AuctionDto>>> GetAuctionsBySeller(string sellerId)
        {
            var auctions = await _auctionService.GetAuctionsBySellerAsync(sellerId);
            return Ok(auctions);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<AuctionDto>>> SearchAuctions([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest("Search query is required");

            var auctions = await _auctionService.SearchAuctionsAsync(q);
            return Ok(auctions);
        }

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _auctionService.GetCategoriesAsync();
            return Ok(categories);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<AuctionDto>> CreateAuction(CreateAuctionDto createAuctionDto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var auction = await _auctionService.CreateAuctionAsync(createAuctionDto, userId);
                return CreatedAtAction(nameof(GetAuction), new { id = auction.Id }, auction);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("test")]
        public async Task<ActionResult<AuctionDto>> CreateTestAuction(CreateAuctionDto createAuctionDto)
        {
            try
            {
                // Use the first available user for testing
                var testUserId = await _auctionService.GetFirstUserIdAsync();
                if (string.IsNullOrEmpty(testUserId))
                    return BadRequest("No users found in database. Please ensure users are seeded.");

                var auction = await _auctionService.CreateAuctionAsync(createAuctionDto, testUserId);
                return CreatedAtAction(nameof(GetAuction), new { id = auction.Id }, auction);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating auction: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<AuctionDto>> UpdateAuction(int id, UpdateAuctionDto updateAuctionDto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var auction = await _auctionService.UpdateAuctionAsync(id, updateAuctionDto, userId);
            return auction != null ? Ok(auction) : NotFound();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteAuction(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _auctionService.DeleteAuctionAsync(id, userId);
            return result ? NoContent() : NotFound();
        }

        [HttpPost("{id}/start")]
        [Authorize]
        public async Task<ActionResult> StartAuction(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _auctionService.StartAuctionAsync(id, userId);
            return result ? Ok() : BadRequest("Failed to start auction");
        }

        [HttpPost("{id}/end")]
        [Authorize]
        public async Task<ActionResult> EndAuction(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _auctionService.EndAuctionAsync(id, userId);
            return result ? Ok() : BadRequest("Failed to end auction");
        }
    }
}
