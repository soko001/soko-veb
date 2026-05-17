using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace UserService.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<TokenValidationResponseDto> ValidateTokenAsync(string token);
    }

    public class AuthService : IAuthService
    {
        private readonly UserDbContext _db;
        private readonly IJwtService _jwt;
        private readonly IConfiguration _config;

        public AuthService(UserDbContext db, IJwtService jwt, IConfiguration config)
        {
            _db = db;
            _jwt = jwt;
            _config = config;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
                throw new InvalidOperationException("Email already in use.");

            var adminSecret = _config["AdminSecret"];
            var role = (!string.IsNullOrEmpty(dto.AdminKey) && dto.AdminKey == adminSecret)
                ? UserRole.Admin
                : UserRole.User;

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return BuildAuthResponse(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            if (!user.IsActive)
                throw new UnauthorizedAccessException("Account is disabled.");

            return BuildAuthResponse(user);
        }

        public Task<TokenValidationResponseDto> ValidateTokenAsync(string token)
        {
            try
            {
                var principal = _jwt.ValidateToken(token);
                var userId = int.Parse(principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? principal.FindFirst("sub")?.Value ?? "0");

                return Task.FromResult(new TokenValidationResponseDto
                {
                    IsValid = true,
                    UserId = userId,
                    Email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
                    Role = principal.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                });
            }
            catch
            {
                return Task.FromResult(new TokenValidationResponseDto { IsValid = false });
            }
        }

        private AuthResponseDto BuildAuthResponse(User user) => new AuthResponseDto
        {
            Token = _jwt.GenerateToken(user),
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            UserId = user.Id
        };
    }
}