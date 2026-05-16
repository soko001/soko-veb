using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SharingService.Data;
using SharingService.DTOs;
using SharingService.Models;

namespace SharingService.Services
{
    public interface ISharingTokenService
    {
        Task<ShareTokenDto> CreateTokenAsync(int userId, CreateShareTokenDto dto);
        Task<ShareTokenValidationResponseDto> ValidateTokenAsync(string token);
        Task<List<ShareTokenDto>> GetTokensForPlanAsync(int planId, int userId);
        Task RevokeTokenAsync(int tokenId, int userId);
    }

    public class SharingTokenService : ISharingTokenService
    {
        private readonly SharingDbContext _db;

        public SharingTokenService(SharingDbContext db)
        {
            _db = db;
        }

        public async Task<ShareTokenDto> CreateTokenAsync(int userId, CreateShareTokenDto dto)
        {
            var shareToken = new ShareToken
            {
                Token = Guid.NewGuid().ToString("N"), // 32-char hex string
                TravelPlanId = dto.TravelPlanId,
                CreatedByUserId = userId,
                AccessLevel = dto.AccessLevel,
                ExpiresAt = dto.ExpiresInHours.HasValue
                    ? DateTime.UtcNow.AddHours(dto.ExpiresInHours.Value)
                    : (DateTime?)null
            };

            _db.ShareTokens.Add(shareToken);
            await _db.SaveChangesAsync();
            return MapToDto(shareToken);
        }

        public async Task<ShareTokenValidationResponseDto> ValidateTokenAsync(string token)
        {
            var shareToken = await _db.ShareTokens
                .FirstOrDefaultAsync(s => s.Token == token);

            if (shareToken == null)
                return Invalid("Token not found.");

            if (!shareToken.IsActive)
                return Invalid("Token has been revoked.");

            if (shareToken.ExpiresAt.HasValue && shareToken.ExpiresAt.Value < DateTime.UtcNow)
                return Invalid("Token has expired.");

            return new ShareTokenValidationResponseDto
            {
                IsValid = true,
                TravelPlanId = shareToken.TravelPlanId,
                AccessLevel = shareToken.AccessLevel.ToString()
            };
        }

        public async Task<List<ShareTokenDto>> GetTokensForPlanAsync(int planId, int userId)
        {
            var tokens = await _db.ShareTokens
                .Where(s => s.TravelPlanId == planId && s.CreatedByUserId == userId)
                .ToListAsync();

            return tokens.Select(MapToDto).ToList();
        }

        public async Task RevokeTokenAsync(int tokenId, int userId)
        {
            var token = await _db.ShareTokens.FindAsync(tokenId);
            if (token == null) throw new KeyNotFoundException($"Token {tokenId} not found.");
            if (token.CreatedByUserId != userId) throw new UnauthorizedAccessException("Access denied.");

            token.IsActive = false;
            await _db.SaveChangesAsync();
        }

        private static ShareTokenValidationResponseDto Invalid(string reason) =>
            new ShareTokenValidationResponseDto { IsValid = false, Reason = reason };

        private static ShareTokenDto MapToDto(ShareToken s) => new ShareTokenDto
        {
            Id = s.Id,
            Token = s.Token,
            TravelPlanId = s.TravelPlanId,
            CreatedByUserId = s.CreatedByUserId,
            AccessLevel = s.AccessLevel.ToString(),
            CreatedAt = s.CreatedAt,
            ExpiresAt = s.ExpiresAt,
            IsActive = s.IsActive
        };
    }
}