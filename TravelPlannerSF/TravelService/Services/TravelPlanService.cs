using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelService.Data;
using TravelService.DTOs;
using TravelService.Models;

namespace TravelService.Services
{
    public interface ITravelPlanService
    {
        Task<List<TravelPlanSummaryDto>> GetAllByUserAsync(int userId);
        Task<TravelPlanDto> GetByIdAsync(int id, int userId);
        Task<TravelPlanDto> CreateAsync(int userId, CreateTravelPlanDto dto);
        Task<TravelPlanDto> UpdateAsync(int id, int userId, UpdateTravelPlanDto dto);
        Task DeleteAsync(int id, int userId);
    }

    public class TravelPlanService : ITravelPlanService
    {
        private readonly TravelDbContext _db;

        public TravelPlanService(TravelDbContext db)
        {
            _db = db;
        }

        public async Task<List<TravelPlanSummaryDto>> GetAllByUserAsync(int userId)
        {
            var plans = await _db.TravelPlans
                .Where(t => t.UserId == userId)
                .Include(t => t.Destinations)
                .Include(t => t.Activities)
                .Include(t => t.Expenses)
                .ToListAsync();

            return plans.Select(MapToSummary).ToList();
        }

        public async Task<TravelPlanDto> GetByIdAsync(int id, int userId)
        {
            var plan = await FindOrThrowAsync(id, userId);
            return MapToDto(plan);
        }

        public async Task<TravelPlanDto> CreateAsync(int userId, CreateTravelPlanDto dto)
        {
            if (dto.EndDate < dto.StartDate)
                throw new ArgumentException("End date cannot be before start date.");
            if (dto.Budget < 0)
                throw new ArgumentException("Budget cannot be negative.");

            var plan = new TravelPlan
            {
                UserId = userId,
                Name = dto.Name,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Budget = dto.Budget,
                Notes = dto.Notes
            };

            _db.TravelPlans.Add(plan);
            await _db.SaveChangesAsync();
            return MapToDto(plan);
        }

        public async Task<TravelPlanDto> UpdateAsync(int id, int userId, UpdateTravelPlanDto dto)
        {
            var plan = await FindOrThrowAsync(id, userId);

            if (!string.IsNullOrEmpty(dto.Name)) plan.Name = dto.Name;
            if (dto.Description != null) plan.Description = dto.Description;
            if (dto.Notes != null) plan.Notes = dto.Notes;
            if (dto.Budget.HasValue)
            {
                if (dto.Budget.Value < 0) throw new ArgumentException("Budget cannot be negative.");
                plan.Budget = dto.Budget.Value;
            }

            var start = dto.StartDate ?? plan.StartDate;
            var end = dto.EndDate ?? plan.EndDate;
            if (end < start) throw new ArgumentException("End date cannot be before start date.");
            if (dto.StartDate.HasValue) plan.StartDate = dto.StartDate.Value;
            if (dto.EndDate.HasValue) plan.EndDate = dto.EndDate.Value;

            await _db.SaveChangesAsync();
            return MapToDto(plan);
        }

        public async Task DeleteAsync(int id, int userId)
        {
            var plan = await FindOrThrowAsync(id, userId);
            _db.TravelPlans.Remove(plan);
            await _db.SaveChangesAsync();
        }

        private async Task<TravelPlan> FindOrThrowAsync(int id, int userId)
        {
            var plan = await _db.TravelPlans
                .Include(t => t.Destinations)
                .Include(t => t.Activities)
                .Include(t => t.Expenses)
                .Include(t => t.ChecklistItems)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (plan == null) throw new KeyNotFoundException($"Travel plan {id} not found.");
            if (plan.UserId != userId) throw new UnauthorizedAccessException("Access denied.");
            return plan;
        }

        private static TravelPlanSummaryDto MapToSummary(TravelPlan t)
        {
            var totalExpenses = t.Expenses?.Sum(e => e.Amount) ?? 0;
            return new TravelPlanSummaryDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                Budget = t.Budget,
                TotalExpenses = totalExpenses,
                RemainingBudget = t.Budget - totalExpenses,
                CreatedAt = t.CreatedAt,
                DestinationCount = t.Destinations?.Count ?? 0,
                ActivityCount = t.Activities?.Count ?? 0
            };
        }

        internal static TravelPlanDto MapToDto(TravelPlan t)
        {
            var totalExpenses = t.Expenses?.Sum(e => e.Amount) ?? 0;
            return new TravelPlanDto
            {
                Id = t.Id,
                UserId = t.UserId,
                Name = t.Name,
                Description = t.Description,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                Budget = t.Budget,
                TotalExpenses = totalExpenses,
                RemainingBudget = t.Budget - totalExpenses,
                Notes = t.Notes,
                CreatedAt = t.CreatedAt,
                Destinations = t.Destinations?.Select(DestinationService.MapToDto).ToList() ?? new List<DestinationDto>(),
                Activities = t.Activities?.Select(ActivityService.MapToDto).ToList() ?? new List<ActivityDto>(),
                Expenses = t.Expenses?.Select(ExpenseService.MapToDto).ToList() ?? new List<ExpenseDto>(),
                ChecklistItems = t.ChecklistItems?.Select(ChecklistService.MapToDto).ToList() ?? new List<ChecklistItemDto>()
            };
        }
    }
}