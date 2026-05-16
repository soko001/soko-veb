using System;
using System.Collections.Generic;

namespace TravelService.Models
{
    public class TravelPlan
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Budget { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Destination> Destinations { get; set; } = new List<Destination>();
        public List<Activity> Activities { get; set; } = new List<Activity>();
        public List<Expense> Expenses { get; set; } = new List<Expense>();
        public List<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();
    }

    public class Destination
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public DateTime ArrivalDate { get; set; }
        public DateTime DepartureDate { get; set; }
        public string Description { get; set; }
        public string Notes { get; set; }

        public TravelPlan TravelPlan { get; set; }
    }

    public class Activity
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan? Time { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }
        public decimal? EstimatedCost { get; set; }
        public ActivityStatus Status { get; set; } = ActivityStatus.Planned;

        public TravelPlan TravelPlan { get; set; }
    }

    public enum ActivityStatus
    {
        Planned = 0,
        Reserved = 1,
        Completed = 2,
        Cancelled = 3
    }

    public class Expense
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public ExpenseCategory Category { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }

        public TravelPlan TravelPlan { get; set; }
    }

    public enum ExpenseCategory
    {
        Transport = 0,
        Accommodation = 1,
        Food = 2,
        Tickets = 3,
        Shopping = 4,
        Other = 5
    }

    public class ChecklistItem
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public bool IsCompleted { get; set; } = false;

        public TravelPlan TravelPlan { get; set; }
    }
}