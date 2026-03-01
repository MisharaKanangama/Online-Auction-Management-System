using AuctionManagement.API.DTOs;
using AuctionManagement.API.Models;
using AutoMapper;

namespace AuctionManagement.API.Services
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>();
            CreateMap<RegisterDto, User>();
            CreateMap<UpdateProfileDto, User>();

            // Auction mappings
            CreateMap<Auction, AuctionDto>();
            CreateMap<CreateAuctionDto, Auction>();
            CreateMap<UpdateAuctionDto, Auction>();

            // Bid mappings
            CreateMap<Bid, BidDto>();
            CreateMap<CreateBidDto, Bid>();
        }
    }
}
