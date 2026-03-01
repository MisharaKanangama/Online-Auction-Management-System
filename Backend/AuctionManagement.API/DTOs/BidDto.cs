using AuctionManagement.API.Models;

namespace AuctionManagement.API.DTOs
{
    public class BidDto
    {
        public int Id { get; set; }
        public int AuctionId { get; set; }
        public string BidderId { get; set; } = string.Empty;
        public string BidderName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime BidTime { get; set; }
        public string? Comment { get; set; }
        public bool IsWinningBid { get; set; }
    }

    public class CreateBidDto
    {
        public int AuctionId { get; set; }
        public decimal Amount { get; set; }
        public string? Comment { get; set; }
    }

    public class BidHistoryDto
    {
        public int AuctionId { get; set; }
        public string AuctionTitle { get; set; } = string.Empty;
        public List<BidDto> Bids { get; set; } = new List<BidDto>();
    }
}
