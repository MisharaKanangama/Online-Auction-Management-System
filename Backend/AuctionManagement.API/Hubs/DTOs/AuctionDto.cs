using AuctionManagement.API.Models;

namespace AuctionManagement.API.DTOs
{
    public class AuctionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal StartingBid { get; set; }
        public decimal? ReservePrice { get; set; }
        public decimal? CurrentBid { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public AuctionStatus Status { get; set; }
        public string? ImageUrl { get; set; }
        public string? Condition { get; set; }
        public string? Location { get; set; }
        public string SellerId { get; set; } = string.Empty;
        public string? WinnerId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string? WinnerName { get; set; }
        public int BidCount { get; set; }
        public string? TimeRemaining { get; set; }
        public List<AuctionImageDto>? Images { get; set; }
    }

    public class CreateAuctionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal StartingBid { get; set; }
        public decimal? ReservePrice { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? ImageUrl { get; set; }
        public string? Condition { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateAuctionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal StartingBid { get; set; }
        public decimal? ReservePrice { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? ImageUrl { get; set; }
        public string? Condition { get; set; }
        public string? Location { get; set; }
    }

    public class AuctionImageDto
    {
        public int Id { get; set; }
        public int AuctionId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
