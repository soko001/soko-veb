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
    public interface IActivityService
    {
        Task<List<ActivityDto>> GetAllAsync(int planId, int userId);
        Task<ActivityDto> GetByIdAsync(int planId, int id, int userId);
        Task<ActivityDto> CreateAsync(int planId, int userId, CreateActivityDto dto);
        Task<ActivityDto> UpdateAsync(int planId, int id, int userId, UpdateActivityDto dto);
        Task DeleteAsync(int planId, int id, int userId);
    }

    public class ActivityService : IActivityService
    {
        private readonly TravelDbContext _db;

        public ActivityService(TravelDbContext db)
        {
            _db = db;
        }

        public async Task<List<ActivityDto>> GetAllAsync(int planId, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var items = await _db.Activities.Where(a => a.TravelPlanId == planId).ToListAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<ActivityDto> GetByIdAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            return MapToDto(item);
        }

        public async Task<ActivityDto> CreateAsync(int planId, int userId, CreateActivityDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);

            var item = new Activity
            {
                TravelPlanId = planId,
                Name = dto.Name,
                Date = dto.Date,
                Time = dto.Time,
                Location = dto.Location,
                Description = dto.Description,
                EstimatedCost = dto.EstimatedCost,
                Status = dto.Status
            };

            _db.Activities.Add(item);
            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task<ActivityDto> UpdateAsync(int planId, int id, int userId, UpdateActivityDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);

            if (!string.IsNullOrEmpty(dto.Name)) item.Name = dto.Name;
            if (dto.Date.HasValue) item.Date = dto.Date.Value;
            if (dto.Time.HasValue) item.Time = dto.Time;
            if (dto.Location != null) item.Location = dto.Location;
            if (dto.Description != null) item.Description = dto.Description;
            if (dto.EstimatedCost.HasValue) item.EstimatedCost = dto.EstimatedCost;
            if (dto.Status.HasValue) item.Status = dto.Status.Value;

            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task DeleteAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            _db.Activities.Remove(item);
            await _db.SaveChangesAsync();
        }

        private async Task EnsurePlanOwnershipAsync(int planId, int userId)
        {
            var plan = await _db.TravelPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException($"Travel plan {planId} not found.");
            if (plan.UserId != userId) throw new UnauthorizedAccessException("Access denied.");
        }

        private async Task<Activity> FindOrThrowAsync(int planId, int id)
        {
            var item = await _db.Activities.FirstOrDefaultAsync(a => a.Id == id && a.TravelPlanId == planId);
            if (item == null) throw new KeyNotFoundException($"Activity {id} not found.");
            return item;
        }

        internal static ActivityDto MapToDto(Activity a) => new ActivityDto
        {
            Id = a.Id,
            TravelPlanId = a.TravelPlanId,
            Name = a.Name,
            Date = a.Date,
            Time = a.Time,
            Location = a.Location,
            Description = a.Description,
            EstimatedCost = a.EstimatedCost,
            Status = a.Status.ToString()
        };
    }
}