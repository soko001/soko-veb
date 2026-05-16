using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TravelService.Models;

namespace TravelService.DTOs
{
    // ---------- TravelPlan ----------

    public class CreateTravelPlanDto
    {
        [Required]
        public string Name { get; set; }
        public string Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Budget cannot be negative.")]
        public decimal Budget { get; set; }

        public string Notes { get; set; }
    }

    public class UpdateTravelPlanDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Budget cannot be negative.")]
        public decimal? Budget { get; set; }

        public string Notes { get; set; }
    }

    public class TravelPlanDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Budget { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal RemainingBudget { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<DestinationDto> Destinations { get; set; }
        public List<ActivityDto> Activities { get; set; }
        public List<ExpenseDto> Expenses { get; set; }
        public List<ChecklistItemDto> ChecklistItems { get; set; }
    }

    public class TravelPlanSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Budget { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal RemainingBudget { get; set; }
        public DateTime CreatedAt { get; set; }
        public int DestinationCount { get; set; }
        public int ActivityCount { get; set; }
    }

    // ---------- Destination ----------

    public class CreateDestinationDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public string Location { get; set; }

        [Required]
        public DateTime ArrivalDate { get; set; }

        [Required]
        public DateTime DepartureDate { get; set; }

        public string Description { get; set; }
        public string Notes { get; set; }
    }

    public class UpdateDestinationDto
    {
        public string Name { get; set; }
        public string Location { get; set; }
        public DateTime? ArrivalDate { get; set; }
        public DateTime? DepartureDate { get; set; }
        public string Description { get; set; }
        public string Notes { get; set; }
    }

    public class DestinationDto
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public DateTime ArrivalDate { get; set; }
        public DateTime DepartureDate { get; set; }
        public string Description { get; set; }
        public string Notes { get; set; }
    }

    // ---------- Activity ----------

    public class CreateActivityDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public TimeSpan? Time { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? EstimatedCost { get; set; }

        public ActivityStatus Status { get; set; } = ActivityStatus.Planned;
    }

    public class UpdateActivityDto
    {
        public string Name { get; set; }
        public DateTime? Date { get; set; }
        public TimeSpan? Time { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? EstimatedCost { get; set; }

        public ActivityStatus? Status { get; set; }
    }

    public class ActivityDto
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan? Time { get; set; }
        public string Location { get; set; }
        public string Description { get; set; }
        public decimal? EstimatedCost { get; set; }
        public string Status { get; set; }
    }

    // ---------- Expense ----------

    public class CreateExpenseDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public ExpenseCategory Category { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0.")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public string Description { get; set; }
    }

    public class UpdateExpenseDto
    {
        public string Name { get; set; }
        public ExpenseCategory? Category { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Amount { get; set; }

        public DateTime? Date { get; set; }
        public string Description { get; set; }
    }

    public class ExpenseDto
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }
    }

    // ---------- Checklist ----------

    public class CreateChecklistItemDto
    {
        [Required]
        public string Name { get; set; }
    }

    public class UpdateChecklistItemDto
    {
        public string Name { get; set; }
        public bool? IsCompleted { get; set; }
    }

    public class ChecklistItemDto
    {
        public int Id { get; set; }
        public int TravelPlanId { get; set; }
        public string Name { get; set; }
        public bool IsCompleted { get; set; }
    }
}