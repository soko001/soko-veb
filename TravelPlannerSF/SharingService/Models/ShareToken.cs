using System;

namespace SharingService.Models
{
    public class ShareToken
    {
        public int Id { get; set; }
        public string Token { get; set; }
        public int TravelPlanId { get; set; }
        public int CreatedByUserId { get; set; }
        public ShareAccessLevel AccessLevel { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public enum ShareAccessLevel
    {
        View = 0,
        Edit = 1
    }
}