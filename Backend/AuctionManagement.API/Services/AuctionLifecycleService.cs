using AuctionManagement.API.Data;
using AuctionManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AuctionManagement.API.Services
{
    public class AuctionLifecycleService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AuctionLifecycleService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1); // Check every minute

        public AuctionLifecycleService(IServiceProvider serviceProvider, ILogger<AuctionLifecycleService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Auction Lifecycle Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessAuctionLifecycle();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing auction lifecycle");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Auction Lifecycle Service stopped");
        }

        private async Task ProcessAuctionLifecycle()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AuctionDbContext>();

            var now = DateTime.Now;

            // Process auctions that should start (Scheduled → Active)
            await ProcessScheduledAuctions(context, now);

            // Process auctions that should end (Active → Ended)
            await ProcessActiveAuctions(context, now);
        }

        private async Task ProcessScheduledAuctions(AuctionDbContext context, DateTime now)
        {
            var scheduledAuctions = await context.Auctions
                .Where(a => a.Status == AuctionStatus.Scheduled && a.StartTime <= now && a.EndTime > now)
                .ToListAsync();

            foreach (var auction in scheduledAuctions)
            {
                auction.Status = AuctionStatus.Active;
                auction.UpdatedAt = now;
                _logger.LogInformation($"Auction {auction.Id} ({auction.Title}) started automatically");
            }

            if (scheduledAuctions.Any())
            {
                await context.SaveChangesAsync();
                _logger.LogInformation($"Started {scheduledAuctions.Count} auctions");
            }
        }

        private async Task ProcessActiveAuctions(AuctionDbContext context, DateTime now)
        {
            var activeAuctions = await context.Auctions
                .Include(a => a.Bids)
                .Where(a => a.Status == AuctionStatus.Active && a.EndTime <= now)
                .ToListAsync();

            foreach (var auction in activeAuctions)
            {
                // Set status to Ended
                auction.Status = AuctionStatus.Ended;
                auction.UpdatedAt = now;

                // Determine winner (highest bidder)
                var winningBid = auction.Bids
                    .Where(b => b.Amount > 0) // Ensure there are actual bids
                    .OrderByDescending(b => b.Amount)
                    .FirstOrDefault();

                if (winningBid != null)
                {
                    auction.WinnerId = winningBid.BidderId;
                    auction.CurrentBid = winningBid.Amount;
                    winningBid.IsWinningBid = true;

                    _logger.LogInformation($"Auction {auction.Id} ({auction.Title}) ended. Winner: {winningBid.BidderId} with bid ${winningBid.Amount}");
                }
                else
                {
                    _logger.LogInformation($"Auction {auction.Id} ({auction.Title}) ended with no bids");
                }
            }

            if (activeAuctions.Any())
            {
                await context.SaveChangesAsync();
                _logger.LogInformation($"Ended {activeAuctions.Count} auctions");
            }
        }
    }
}
