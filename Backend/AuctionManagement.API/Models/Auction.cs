using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuctionManagement.API.Models
{
    public class Auction
    {
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal StartingBid { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ReservePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CurrentBid { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [Required]
        public AuctionStatus Status { get; set; } = AuctionStatus.Scheduled;

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        [StringLength(100)]
        public string? Condition { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }

        [Required]
        public string SellerId { get; set; } = string.Empty;

        public string? WinnerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("SellerId")]
        public virtual User Seller { get; set; } = null!;

        [ForeignKey("WinnerId")]
        public virtual User? Winner { get; set; }

        public virtual ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public virtual ICollection<AuctionImage> Images { get; set; } = new List<AuctionImage>();
    }

    public enum AuctionStatus
    {
        Scheduled,
        Active,
        Ended,
        Cancelled,
        Completed
    }
}
