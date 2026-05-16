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
    public interface IChecklistService
    {
        Task<List<ChecklistItemDto>> GetAllAsync(int planId, int userId);
        Task<ChecklistItemDto> GetByIdAsync(int planId, int id, int userId);
        Task<ChecklistItemDto> CreateAsync(int planId, int userId, CreateChecklistItemDto dto);
        Task<ChecklistItemDto> UpdateAsync(int planId, int id, int userId, UpdateChecklistItemDto dto);
        Task DeleteAsync(int planId, int id, int userId);
    }

    public class ChecklistService : IChecklistService
    {
        private readonly TravelDbContext _db;

        public ChecklistService(TravelDbContext db)
        {
            _db = db;
        }

        public async Task<List<ChecklistItemDto>> GetAllAsync(int planId, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var items = await _db.ChecklistItems.Where(c => c.TravelPlanId == planId).ToListAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<ChecklistItemDto> GetByIdAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            return MapToDto(item);
        }

        public async Task<ChecklistItemDto> CreateAsync(int planId, int userId, CreateChecklistItemDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);

            var item = new ChecklistItem
            {
                TravelPlanId = planId,
                Name = dto.Name
            };

            _db.ChecklistItems.Add(item);
            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task<ChecklistItemDto> UpdateAsync(int planId, int id, int userId, UpdateChecklistItemDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);

            if (!string.IsNullOrEmpty(dto.Name)) item.Name = dto.Name;
            if (dto.IsCompleted.HasValue) item.IsCompleted = dto.IsCompleted.Value;

            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task DeleteAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            _db.ChecklistItems.Remove(item);
            await _db.SaveChangesAsync();
        }

        private async Task EnsurePlanOwnershipAsync(int planId, int userId)
        {
            var plan = await _db.TravelPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException($"Travel plan {planId} not found.");
            if (plan.UserId != userId) throw new UnauthorizedAccessException("Access denied.");
        }

        private async Task<ChecklistItem> FindOrThrowAsync(int planId, int id)
        {
            var item = await _db.ChecklistItems.FirstOrDefaultAsync(c => c.Id == id && c.TravelPlanId == planId);
            if (item == null) throw new KeyNotFoundException($"Checklist item {id} not found.");
            return item;
        }

        internal static ChecklistItemDto MapToDto(ChecklistItem c) => new ChecklistItemDto
        {
            Id = c.Id,
            TravelPlanId = c.TravelPlanId,
            Name = c.Name,
            IsCompleted = c.IsCompleted
        };
    }
}