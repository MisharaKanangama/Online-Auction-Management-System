using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuctionManagement.API.Models
{
    public class Transaction
    {
        public int Id { get; set; }

        [Required]
        public int AuctionId { get; set; }

        [Required]
        public string BuyerId { get; set; } = string.Empty;

        [Required]
        public string SellerId { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PlatformFee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SellerAmount { get; set; }

        [Required]
        public TransactionStatus Status { get; set; } = TransactionStatus.Pending;

        [Required]
        public TransactionType Type { get; set; }

        [StringLength(100)]
        public string? PaymentMethod { get; set; }

        [StringLength(200)]
        public string? PaymentReference { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }

        // Navigation properties
        [ForeignKey("AuctionId")]
        public virtual Auction Auction { get; set; } = null!;

        [ForeignKey("BuyerId")]
        public virtual User Buyer { get; set; } = null!;

        [ForeignKey("SellerId")]
        public virtual User Seller { get; set; } = null!;
    }

    public enum TransactionStatus
    {
        Pending,
        Processing,
        Completed,
        Failed,
        Refunded,
        Cancelled
    }

    public enum TransactionType
    {
        Sale,
        Fee,
        Refund
    }
}
