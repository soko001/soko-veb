using System;
using System.ComponentModel.DataAnnotations;
using SharingService.Models;

namespace SharingService.DTOs
{
    public class CreateShareTokenDto
    {
        [Required]
        public int TravelPlanId { get; set; }

        [Required]
        public ShareAccessLevel AccessLevel { get; set; }

        // Optional expiry in hours; null = never expires
        public int? ExpiresInHours { get; set; }
    }

    public class ShareTokenDto
    {
        public int Id { get; set; }
        public string Token { get; set; }
        public int TravelPlanId { get; set; }
        public int CreatedByUserId { get; set; }
        public string AccessLevel { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class ValidateShareTokenDto
    {
        [Required]
        public string Token { get; set; }
    }

    public class ShareTokenValidationResponseDto
    {
        public bool IsValid { get; set; }
        public int? TravelPlanId { get; set; }
        public string AccessLevel { get; set; }
        public string Reason { get; set; }  // populated when IsValid = false
    }
}