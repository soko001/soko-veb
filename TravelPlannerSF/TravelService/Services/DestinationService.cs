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
    public interface IDestinationService
    {
        Task<List<DestinationDto>> GetAllAsync(int planId, int userId);
        Task<DestinationDto> GetByIdAsync(int planId, int id, int userId);
        Task<DestinationDto> CreateAsync(int planId, int userId, CreateDestinationDto dto);
        Task<DestinationDto> UpdateAsync(int planId, int id, int userId, UpdateDestinationDto dto);
        Task DeleteAsync(int planId, int id, int userId);
    }

    public class DestinationService : IDestinationService
    {
        private readonly TravelDbContext _db;

        public DestinationService(TravelDbContext db)
        {
            _db = db;
        }

        public async Task<List<DestinationDto>> GetAllAsync(int planId, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var items = await _db.Destinations.Where(d => d.TravelPlanId == planId).ToListAsync();
            return items.Select(MapToDto).ToList();
        }

        public async Task<DestinationDto> GetByIdAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            return MapToDto(item);
        }

        public async Task<DestinationDto> CreateAsync(int planId, int userId, CreateDestinationDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            if (dto.DepartureDate < dto.ArrivalDate)
                throw new ArgumentException("Departure date cannot be before arrival date.");

            var item = new Destination
            {
                TravelPlanId = planId,
                Name = dto.Name,
                Location = dto.Location,
                ArrivalDate = dto.ArrivalDate,
                DepartureDate = dto.DepartureDate,
                Description = dto.Description,
                Notes = dto.Notes
            };

            _db.Destinations.Add(item);
            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task<DestinationDto> UpdateAsync(int planId, int id, int userId, UpdateDestinationDto dto)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);

            if (!string.IsNullOrEmpty(dto.Name)) item.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Location)) item.Location = dto.Location;
            if (dto.Description != null) item.Description = dto.Description;
            if (dto.Notes != null) item.Notes = dto.Notes;

            var arrival = dto.ArrivalDate ?? item.ArrivalDate;
            var departure = dto.DepartureDate ?? item.DepartureDate;
            if (departure < arrival) throw new ArgumentException("Departure date cannot be before arrival date.");
            if (dto.ArrivalDate.HasValue) item.ArrivalDate = dto.ArrivalDate.Value;
            if (dto.DepartureDate.HasValue) item.DepartureDate = dto.DepartureDate.Value;

            await _db.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task DeleteAsync(int planId, int id, int userId)
        {
            await EnsurePlanOwnershipAsync(planId, userId);
            var item = await FindOrThrowAsync(planId, id);
            _db.Destinations.Remove(item);
            await _db.SaveChangesAsync();
        }

        private async Task EnsurePlanOwnershipAsync(int planId, int userId)
        {
            var plan = await _db.TravelPlans.FindAsync(planId);
            if (plan == null) throw new KeyNotFoundException($"Travel plan {planId} not found.");
            if (plan.UserId != userId) throw new UnauthorizedAccessException("Access denied.");
        }

        private async Task<Destination> FindOrThrowAsync(int planId, int id)
        {
            var item = await _db.Destinations.FirstOrDefaultAsync(d => d.Id == id && d.TravelPlanId == planId);
            if (item == null) throw new KeyNotFoundException($"Destination {id} not found.");
            return item;
        }

        internal static DestinationDto MapToDto(Destination d) => new DestinationDto
        {
            Id = d.Id,
            TravelPlanId = d.TravelPlanId,
            Name = d.Name,
            Location = d.Location,
            ArrivalDate = d.ArrivalDate,
            DepartureDate = d.DepartureDate,
            Description = d.Description,
            Notes = d.Notes
        };
    }
}