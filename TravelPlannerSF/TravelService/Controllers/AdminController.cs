using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelService.Data;
using TravelService.DTOs;

namespace TravelService.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly TravelDbContext _db;

        public AdminController(TravelDbContext db)
        {
            _db = db;
        }

        [HttpGet("travel-plans")]
        public async Task<IActionResult> GetAllPlans()
        {
            var plans = await _db.TravelPlans
                .Include(t => t.Expenses)
                .ToListAsync();

            var result = plans.Select(t => new TravelPlanDto
            {
                Id = t.Id,
                UserId = t.UserId,
                Name = t.Name,
                Description = t.Description,
                StartDate = t.StartDate,
                EndDate = t.EndDate,
                Budget = t.Budget,
                TotalExpenses = t.Expenses.Sum(e => e.Amount),
                RemainingBudget = t.Budget - t.Expenses.Sum(e => e.Amount),
                Notes = t.Notes,
                CreatedAt = t.CreatedAt
            }).ToList();

            return Ok(result);
        }

        [HttpGet("travel-plans/{id}")]
        public async Task<IActionResult> GetPlanById(int id)
        {
            var plan = await _db.TravelPlans
                .Include(t => t.Destinations)
                .Include(t => t.Activities)
                .Include(t => t.Expenses)
                .Include(t => t.ChecklistItems)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (plan == null) return NotFound();

            var dto = new TravelPlanDto
            {
                Id = plan.Id,
                UserId = plan.UserId,
                Name = plan.Name,
                Description = plan.Description,
                StartDate = plan.StartDate,
                EndDate = plan.EndDate,
                Budget = plan.Budget,
                TotalExpenses = plan.Expenses.Sum(e => e.Amount),
                RemainingBudget = plan.Budget - plan.Expenses.Sum(e => e.Amount),
                Notes = plan.Notes,
                CreatedAt = plan.CreatedAt,
                Destinations = plan.Destinations.Select(d => new DestinationDto
                {
                    Id = d.Id, TravelPlanId = d.TravelPlanId, Name = d.Name,
                    Location = d.Location, ArrivalDate = d.ArrivalDate,
                    DepartureDate = d.DepartureDate, Description = d.Description, Notes = d.Notes
                }).ToList(),
                Activities = plan.Activities.Select(a => new ActivityDto
                {
                    Id = a.Id, TravelPlanId = a.TravelPlanId, Name = a.Name,
                    Date = a.Date, Time = a.Time, Location = a.Location,
                    Description = a.Description, EstimatedCost = a.EstimatedCost,
                    Status = a.Status.ToString()
                }).ToList(),
                Expenses = plan.Expenses.Select(e => new ExpenseDto
                {
                    Id = e.Id, TravelPlanId = e.TravelPlanId, Name = e.Name,
                    Category = e.Category.ToString(), Amount = e.Amount,
                    Date = e.Date, Description = e.Description
                }).ToList(),
                ChecklistItems = plan.ChecklistItems.Select(c => new ChecklistItemDto
                {
                    Id = c.Id, TravelPlanId = c.TravelPlanId,
                    Name = c.Name, IsCompleted = c.IsCompleted
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpDelete("travel-plans/{id}")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            var plan = await _db.TravelPlans.FindAsync(id);
            if (plan == null) return NotFound();
            _db.TravelPlans.Remove(plan);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}