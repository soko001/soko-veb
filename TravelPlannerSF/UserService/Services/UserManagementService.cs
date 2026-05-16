using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace UserService.Services
{
    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto> GetUserByIdAsync(int id);
        Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto);
        Task ChangePasswordAsync(int id, ChangePasswordDto dto);
        Task DeactivateUserAsync(int id);
        Task DeleteUserAsync(int id);
    }

    public class UserManagementService : IUserService
    {
        private readonly UserDbContext _db;

        public UserManagementService(UserDbContext db)
        {
            _db = db;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _db.Users.ToListAsync();
            return users.Select(u => MapToDto(u)).ToList();
        }

        public async Task<UserDto> GetUserByIdAsync(int id)
        {
            var user = await FindOrThrowAsync(id);
            return MapToDto(user);
        }

        public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto)
        {
            var user = await FindOrThrowAsync(id);

            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower() && u.Id != id))
                    throw new InvalidOperationException("Email already in use.");
                user.Email = dto.Email.ToLower();
            }

            if (!string.IsNullOrEmpty(dto.FirstName)) user.FirstName = dto.FirstName;
            if (!string.IsNullOrEmpty(dto.LastName)) user.LastName = dto.LastName;

            await _db.SaveChangesAsync();
            return MapToDto(user);
        }

        public async Task ChangePasswordAsync(int id, ChangePasswordDto dto)
        {
            var user = await FindOrThrowAsync(id);

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Current password is incorrect.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _db.SaveChangesAsync();
        }

        public async Task DeactivateUserAsync(int id)
        {
            var user = await FindOrThrowAsync(id);
            user.IsActive = false;
            await _db.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(int id)
        {
            var user = await FindOrThrowAsync(id);
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }

        private async Task<User> FindOrThrowAsync(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) throw new KeyNotFoundException($"User {id} not found.");
            return user;
        }

        private static UserDto MapToDto(User u) => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Role = u.Role.ToString(),
            CreatedAt = u.CreatedAt,
            IsActive = u.IsActive
        };
    }
}