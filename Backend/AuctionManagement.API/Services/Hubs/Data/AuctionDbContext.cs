using AuctionManagement.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AuctionManagement.API.Data
{
    public class AuctionDbContext : IdentityDbContext<User>
    {
        public AuctionDbContext(DbContextOptions<AuctionDbContext> options) : base(options)
        {
        }

        public DbSet<Auction> Auctions { get; set; }
        public DbSet<Bid> Bids { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<AuctionImage> AuctionImages { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure User entity
            builder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.State).HasMaxLength(50);
                entity.Property(e => e.ZipCode).HasMaxLength(20);
                entity.Property(e => e.Country).HasMaxLength(100);
            });

            // Configure Auction entity
            builder.Entity<Auction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
                entity.Property(e => e.StartingBid).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ReservePrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CurrentBid).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.Property(e => e.Condition).HasMaxLength(100);
                entity.Property(e => e.Location).HasMaxLength(100);
                entity.Property(e => e.SellerId).IsRequired();
                entity.Property(e => e.WinnerId);

                entity.HasOne(e => e.Seller)
                    .WithMany(u => u.CreatedAuctions)
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Winner)
                    .WithMany()
                    .HasForeignKey(e => e.WinnerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Bids)
                    .WithOne(b => b.Auction)
                    .HasForeignKey(b => b.AuctionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Images)
                    .WithOne(i => i.Auction)
                    .HasForeignKey(i => i.AuctionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Bid entity
            builder.Entity<Bid>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.BidderId).IsRequired();
                entity.Property(e => e.Comment).HasMaxLength(500);

                entity.HasOne(e => e.Auction)
                    .WithMany(a => a.Bids)
                    .HasForeignKey(e => e.AuctionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Bidder)
                    .WithMany(u => u.Bids)
                    .HasForeignKey(e => e.BidderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure AuctionImage entity
            builder.Entity<AuctionImage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ContentType).IsRequired().HasMaxLength(100);

                entity.HasOne(e => e.Auction)
                    .WithMany(a => a.Images)
                    .HasForeignKey(e => e.AuctionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Transaction entity
            builder.Entity<Transaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PlatformFee).HasColumnType("decimal(18,2)");
                entity.Property(e => e.SellerAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.BuyerId).IsRequired();
                entity.Property(e => e.SellerId).IsRequired();
                entity.Property(e => e.PaymentMethod).HasMaxLength(100);
                entity.Property(e => e.PaymentReference).HasMaxLength(200);
                entity.Property(e => e.Notes).HasMaxLength(500);

                entity.HasOne(e => e.Auction)
                    .WithMany()
                    .HasForeignKey(e => e.AuctionId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Buyer)
                    .WithMany(u => u.Transactions)
                    .HasForeignKey(e => e.BuyerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed data
            SeedData(builder);
        }

        private void SeedData(ModelBuilder builder)
        {
            // Seed categories
            var categories = new[]
            {
                "Art & Antiques",
                "Collectibles",
                "Electronics",
                "Jewelry & Watches",
                "Vehicles",
                "Real Estate",
                "Sports & Recreation",
                "Books & Media",
                "Fashion & Accessories",
                "Home & Garden"
            };

            // You can add more seed data here as needed
        }
    }
}
