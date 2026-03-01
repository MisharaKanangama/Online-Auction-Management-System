using AuctionManagement.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuctionManagement.API.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AuctionDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Create roles
            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            if (!await roleManager.RoleExistsAsync("User"))
            {
                await roleManager.CreateAsync(new IdentityRole("User"));
            }

            // Create sample users
            var sampleUsers = new[]
            {
                new { Email = "admin@auction.com", FirstName = "Admin", LastName = "User", Password = "Admin123!" },
                new { Email = "john@example.com", FirstName = "John", LastName = "Doe", Password = "Password123!" },
                new { Email = "jane@example.com", FirstName = "Jane", LastName = "Smith", Password = "Password123!" },
                new { Email = "bob@example.com", FirstName = "Bob", LastName = "Johnson", Password = "Password123!" },
                new { Email = "alice@example.com", FirstName = "Alice", LastName = "Brown", Password = "Password123!" },
                new { Email = "charlie@example.com", FirstName = "Charlie", LastName = "Wilson", Password = "Password123!" },
                new { Email = "diana@example.com", FirstName = "Diana", LastName = "Davis", Password = "Password123!" },
                new { Email = "edward@example.com", FirstName = "Edward", LastName = "Miller", Password = "Password123!" }
            };

            foreach (var userData in sampleUsers)
            {
                var existingUser = await userManager.FindByEmailAsync(userData.Email);
                if (existingUser == null)
                {
                    var user = new User
                    {
                        UserName = userData.Email,
                        Email = userData.Email,
                        FirstName = userData.FirstName,
                        LastName = userData.LastName,
                        EmailConfirmed = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    var result = await userManager.CreateAsync(user, userData.Password);
                    if (result.Succeeded)
                    {
                        var role = userData.Email == "admin@auction.com" ? "Admin" : "User";
                        await userManager.AddToRoleAsync(user, role);
                    }
                }
            }

            // Create sample auctions
            var john = await userManager.FindByEmailAsync("john@example.com");
            var jane = await userManager.FindByEmailAsync("jane@example.com");
            var bob = await userManager.FindByEmailAsync("bob@example.com");
            var alice = await userManager.FindByEmailAsync("alice@example.com");
            var charlie = await userManager.FindByEmailAsync("charlie@example.com");
            var diana = await userManager.FindByEmailAsync("diana@example.com");
            var edward = await userManager.FindByEmailAsync("edward@example.com");

            if (john != null && jane != null && bob != null && alice != null && charlie != null && diana != null && edward != null)
            {
                var existingAuctions = await context.Auctions.AnyAsync();
                if (!existingAuctions)
                {
                    var sampleAuctions = new[]
                    {
                        new Auction
                        {
                            Title = "Vintage Rolex Submariner",
                            Description = "Beautiful vintage Rolex Submariner from 1970s. Excellent condition with original box and papers. A true collector's piece.",
                            StartingBid = 5000.00m,
                            CurrentBid = 5000.00m,
                            ReservePrice = 8000.00m,
                            Category = "Jewelry",
                            Condition = "Excellent",
                            Location = "New York, NY",
                            ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
                            StartTime = DateTime.UtcNow.AddDays(-1),
                            EndTime = DateTime.UtcNow.AddDays(6),
                            Status = AuctionStatus.Active,
                            SellerId = john.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        },
                        new Auction
                        {
                            Title = "Antique Persian Rug",
                            Description = "Hand-woven Persian rug from the 1920s. Intricate patterns and vibrant colors. Perfect for any home.",
                            StartingBid = 1200.00m,
                            CurrentBid = 1200.00m,
                            Category = "Antiques",
                            Condition = "Good",
                            Location = "Los Angeles, CA",
                            ImageUrl = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
                            StartTime = DateTime.UtcNow.AddHours(-2),
                            EndTime = DateTime.UtcNow.AddDays(5),
                            Status = AuctionStatus.Active,
                            SellerId = jane.Id,
                            CreatedAt = DateTime.UtcNow.AddHours(-2)
                        },
                        new Auction
                        {
                            Title = "MacBook Pro 16-inch M2",
                            Description = "Brand new MacBook Pro 16-inch with M2 chip. Still sealed in original packaging. Perfect for professionals.",
                            StartingBid = 2000.00m,
                            CurrentBid = 2000.00m,
                            Category = "Electronics",
                            Condition = "New",
                            Location = "San Francisco, CA",
                            ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
                            StartTime = DateTime.UtcNow.AddHours(-1),
                            EndTime = DateTime.UtcNow.AddDays(7),
                            Status = AuctionStatus.Active,
                            SellerId = bob.Id,
                            CreatedAt = DateTime.UtcNow.AddHours(-1)
                        },
                        new Auction
                        {
                            Title = "Vincent van Gogh Print",
                            Description = "High-quality reproduction of Vincent van Gogh's 'Starry Night'. Museum-quality print on canvas.",
                            StartingBid = 150.00m,
                            CurrentBid = 150.00m,
                            Category = "Art & Collectibles",
                            Condition = "Like New",
                            Location = "Chicago, IL",
                            ImageUrl = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500",
                            StartTime = DateTime.UtcNow.AddMinutes(-30),
                            EndTime = DateTime.UtcNow.AddDays(3),
                            Status = AuctionStatus.Active,
                            SellerId = john.Id,
                            CreatedAt = DateTime.UtcNow.AddMinutes(-30)
                        },
                        new Auction
                        {
                            Title = "Vintage Gibson Les Paul",
                            Description = "1970s Gibson Les Paul electric guitar. Classic rock sound with beautiful sunburst finish. Comes with case.",
                            StartingBid = 3000.00m,
                            CurrentBid = 3000.00m,
                            Category = "Other",
                            Condition = "Good",
                            Location = "Nashville, TN",
                            ImageUrl = "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=500",
                            StartTime = DateTime.UtcNow.AddDays(-3),
                            EndTime = DateTime.UtcNow.AddDays(4),
                            Status = AuctionStatus.Active,
                            SellerId = jane.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-3)
                        },
                        new Auction
                        {
                            Title = "Diamond Engagement Ring",
                            Description = "Stunning 1-carat diamond engagement ring in white gold setting. GIA certified diamond with excellent cut and clarity.",
                            StartingBid = 8000.00m,
                            CurrentBid = 8000.00m,
                            ReservePrice = 12000.00m,
                            Category = "Jewelry",
                            Condition = "New",
                            Location = "Miami, FL",
                            ImageUrl = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500",
                            StartTime = DateTime.UtcNow.AddDays(-2),
                            EndTime = DateTime.UtcNow.AddDays(5),
                            Status = AuctionStatus.Active,
                            SellerId = bob.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-2)
                        },
                        new Auction
                        {
                            Title = "iPhone 15 Pro Max",
                            Description = "Latest iPhone 15 Pro Max with 256GB storage. Space Black color, excellent condition with original accessories.",
                            StartingBid = 1200.00m,
                            CurrentBid = 1200.00m,
                            ReservePrice = 1500.00m,
                            Category = "Electronics",
                            Condition = "Like New",
                            Location = "Seattle, WA",
                            ImageUrl = "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
                            StartTime = DateTime.UtcNow.AddHours(-4),
                            EndTime = DateTime.UtcNow.AddDays(6),
                            Status = AuctionStatus.Active,
                            SellerId = alice.Id,
                            CreatedAt = DateTime.UtcNow.AddHours(-4)
                        },
                        new Auction
                        {
                            Title = "Vintage Wine Collection",
                            Description = "Rare collection of vintage wines from 1990s. Includes Bordeaux, Burgundy, and Champagne. Perfect for collectors.",
                            StartingBid = 2500.00m,
                            CurrentBid = 2500.00m,
                            Category = "Collectibles",
                            Condition = "Excellent",
                            Location = "Napa Valley, CA",
                            ImageUrl = "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=500",
                            StartTime = DateTime.UtcNow.AddDays(-1),
                            EndTime = DateTime.UtcNow.AddDays(4),
                            Status = AuctionStatus.Active,
                            SellerId = charlie.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        },
                        new Auction
                        {
                            Title = "Designer Handbag - Hermès",
                            Description = "Authentic Hermès Birkin bag in black leather. Includes authenticity certificate and original dust bag.",
                            StartingBid = 15000.00m,
                            CurrentBid = 15000.00m,
                            ReservePrice = 20000.00m,
                            Category = "Fashion",
                            Condition = "Excellent",
                            Location = "New York, NY",
                            ImageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
                            StartTime = DateTime.UtcNow.AddHours(-6),
                            EndTime = DateTime.UtcNow.AddDays(7),
                            Status = AuctionStatus.Active,
                            SellerId = diana.Id,
                            CreatedAt = DateTime.UtcNow.AddHours(-6)
                        },
                        new Auction
                        {
                            Title = "Vintage Motorcycle - Harley Davidson",
                            Description = "1975 Harley Davidson Sportster in excellent condition. Recently restored with new tires and battery.",
                            StartingBid = 12000.00m,
                            CurrentBid = 12000.00m,
                            ReservePrice = 15000.00m,
                            Category = "Vehicles",
                            Condition = "Good",
                            Location = "Austin, TX",
                            ImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
                            StartTime = DateTime.UtcNow.AddDays(-3),
                            EndTime = DateTime.UtcNow.AddDays(5),
                            Status = AuctionStatus.Active,
                            SellerId = edward.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-3)
                        }
                    };

                    context.Auctions.AddRange(sampleAuctions);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
