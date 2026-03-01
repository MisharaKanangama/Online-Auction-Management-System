using AuctionManagement.API.DTOs;
using AuctionManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AuctionManagement.API.Hubs
{
    [Authorize]
    public class AuctionHub : Hub
    {
        private readonly IBidService _bidService;
        private readonly IAuctionService _auctionService;

        public AuctionHub(IBidService bidService, IAuctionService auctionService)
        {
            _bidService = bidService;
            _auctionService = auctionService;
        }

        public async Task JoinAuctionGroup(int auctionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Auction_{auctionId}");
        }

        public async Task LeaveAuctionGroup(int auctionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Auction_{auctionId}");
        }

        public async Task PlaceBid(int auctionId, decimal amount, string? comment = null)
        {
            try
            {
                var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    await Clients.Caller.SendAsync("BidError", "User not authenticated");
                    return;
                }

                var createBidDto = new CreateBidDto
                {
                    AuctionId = auctionId,
                    Amount = amount,
                    Comment = comment
                };

                var bid = await _bidService.PlaceBidAsync(createBidDto, userId);
                var auction = await _auctionService.GetAuctionByIdAsync(auctionId);

                // Notify all clients in the auction group
                await Clients.Group($"Auction_{auctionId}").SendAsync("NewBid", bid);
                await Clients.Group($"Auction_{auctionId}").SendAsync("AuctionUpdated", auction);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("BidError", ex.Message);
            }
        }

        public async Task GetAuctionUpdates(int auctionId)
        {
            try
            {
                var auction = await _auctionService.GetAuctionByIdAsync(auctionId);
                var bids = await _bidService.GetBidsByAuctionAsync(auctionId);

                await Clients.Caller.SendAsync("AuctionData", auction);
                await Clients.Caller.SendAsync("BidHistory", bids);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}
