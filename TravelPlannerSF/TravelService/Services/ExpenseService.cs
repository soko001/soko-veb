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
    public interface IExpenseService
    {
        Task<List<ExpenseDto>> GetAllAsync(int planId, int userId);
        Task<ExpenseDto> GetByIdAsync(int planId, int id, int userId);
        Task<ExpenseDto> CreateAsync(int planId, int userId, CreateExpenseDto dto);
        Task<ExpenseDto> UpdateAsync(int planId, int id, int userId, UpdateExpenseDto dto);
        Task DeleteAsync(int planId, int id, int userId);
    }

    public class ExpenseService : IExpenseService
    {
        private readonly TravelDbContext _db;

        public ExpenseService(TravelDbContext db)
        {
            _db = db;
        }

        public async Task<List<ExpenseDto>> GetAllAsync(int planId, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var items = await _db.Expenses.Where(e => e.TravelPlanId == planId).ToListAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<ExpenseDto> GetByIdAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            return MapToDto(item);
        }

        public async Task<ExpenseDto> CreateAsync(int planId, int userId, CreateExpenseDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);

            var item = new Expense
            {
                TravelPlanId = planId,
                Name = dto.Name,
                Category = dto.Category,
                Amount = dto.Amount,
                Date = dto.Date,
                Description = dto.Description
            };

            _db.Expenses.Add(item);
            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task<ExpenseDto> UpdateAsync(int planId, int id, int userId, UpdateExpenseDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);

            if (!string.IsNullOrEmpty(dto.Name)) item.Name = dto.Name;
            if (dto.Category.HasValue) item.Category = dto.Category.Value;
            if (dto.Amount.HasValue) item.Amount = dto.Amount.Value;
            if (dto.Date.HasValue) item.Date = dto.Date.Value;
            if (dto.Description != null) item.Description = dto.Description;

            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task DeleteAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            _db.Expenses.Remove(item);
            await _db.SaveChangesAsync();
        }

        private async Task EnsurePlanOwnershipAsync(int planId, int userId)
        {
            var plan = await _db.TravelPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException($"Travel plan {planId} not found.");
            if (plan.UserId != userId) throw new UnauthorizedAccessException("Access denied.");
        }

        private async Task<Expense> FindOrThrowAsync(int planId, int id)
        {
            var item = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.TravelPlanId == planId);
            if (item == null) throw new KeyNotFoundException($"Expense {id} not found.");
            return item;
        }

        internal static ExpenseDto MapToDto(Expense e) => new ExpenseDto
        {
            Id = e.Id,
            TravelPlanId = e.TravelPlanId,
            Name = e.Name,
            Category = e.Category.ToString(),
            Amount = e.Amount,
            Date = e.Date,
            Description = e.Description
        };
    }
}