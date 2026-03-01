using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuctionManagement.API.Models
{
    public class Bid
    {
        public int Id { get; set; }

        [Required]
        public int AuctionId { get; set; }

        [Required]
        public string BidderId { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime BidTime { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Comment { get; set; }

        public bool IsWinningBid { get; set; } = false;

        // Navigation properties
        [ForeignKey("AuctionId")]
        public virtual Auction Auction { get; set; } = null!;

        [ForeignKey("BidderId")]
        public virtual User Bidder { get; set; } = null!;
    }
}
