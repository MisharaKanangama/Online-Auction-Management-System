using AuctionManagement.API.DTOs;
using AuctionManagement.API.Models;

namespace AuctionManagement.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<UserDto?> GetUserByIdAsync(string userId);
        Task<UserDto?> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto);
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<string> GenerateJwtTokenAsync(User user);
    }
}
