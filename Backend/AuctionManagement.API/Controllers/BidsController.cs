using AuctionManagement.API.DTOs;
using AuctionManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BidsController : ControllerBase
    {
        private readonly IBidService _bidService;

        public BidsController(IBidService bidService)
        {
            _bidService = bidService;
        }

        [HttpGet("auction/{auctionId}")]
        public async Task<ActionResult<IEnumerable<BidDto>>> GetBidsByAuction(int auctionId)
        {
            var bids = await _bidService.GetBidsByAuctionAsync(auctionId);
            return Ok(bids);
        }

        [HttpGet("user")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BidDto>>> GetBidsByUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var bids = await _bidService.GetBidsByUserAsync(userId);
            return Ok(bids);
        }

        [HttpGet("auction/{auctionId}/highest")]
        public async Task<ActionResult<BidDto>> GetHighestBid(int auctionId)
        {
            var bid = await _bidService.GetHighestBidAsync(auctionId);
            return bid != null ? Ok(bid) : NotFound();
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<BidDto>> PlaceBid(CreateBidDto createBidDto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var bid = await _bidService.PlaceBidAsync(createBidDto, userId);
                return CreatedAtAction(nameof(GetBidsByAuction), new { auctionId = createBidDto.AuctionId }, bid);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> RetractBid(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _bidService.RetractBidAsync(id, userId);
            return result ? NoContent() : NotFound();
        }

        [HttpGet("history")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BidHistoryDto>>> GetBidHistory()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var history = await _bidService.GetBidHistoryByUserAsync(userId);
            return Ok(history);
        }

        [HttpPost("test")]
        public async Task<ActionResult<BidDto>> PlaceTestBid(CreateBidDto createBidDto)
        {
            try
            {
                // Use a different user than the auction owner for testing
                var testUserId = await _bidService.GetSecondUserIdAsync();
                if (string.IsNullOrEmpty(testUserId))
                    return BadRequest("No second user found in database. Please ensure multiple users are seeded.");

                var bid = await _bidService.PlaceBidAsync(createBidDto, testUserId);
                return CreatedAtAction(nameof(GetBidsByAuction), new { auctionId = createBidDto.AuctionId }, bid);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error placing bid: {ex.Message}");
            }
        }

        [HttpGet("debug/time")]
        public ActionResult<object> GetDebugTime()
        {
            var now = DateTime.UtcNow;
            return Ok(new
            {
                UtcNow = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                UtcNowTicks = now.Ticks,
                Kind = now.Kind.ToString(),
                TimeZone = TimeZoneInfo.Local.Id
            });
        }
    }
}
