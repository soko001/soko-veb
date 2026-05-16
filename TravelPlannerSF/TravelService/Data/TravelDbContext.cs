using Microsoft.EntityFrameworkCore;
using TravelService.Models;

namespace TravelService.Data
{
    public class TravelDbContext : DbContext
    {
        public TravelDbContext(DbContextOptions<TravelDbContext> options) : base(options) { }

        public DbSet<TravelPlan> TravelPlans { get; set; }
        public DbSet<Destination> Destinations { get; set; }
        public DbSet<Activity> Activities { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<ChecklistItem> ChecklistItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TravelPlan>(e =>
            {
                e.HasKey(t => t.Id);
                e.Property(t => t.Name).IsRequired().HasMaxLength(200);
                e.Property(t => t.Budget).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Destination>(e =>
            {
                e.HasKey(d => d.Id);
                e.Property(d => d.Name).IsRequired().HasMaxLength(200);
                e.Property(d => d.Location).IsRequired().HasMaxLength(300);
                e.HasOne(d => d.TravelPlan)
                 .WithMany(t => t.Destinations)
                 .HasForeignKey(d => d.TravelPlanId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Activity>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.Name).IsRequired().HasMaxLength(200);
                e.Property(a => a.EstimatedCost).HasColumnType("decimal(18,2)");
                e.Property(a => a.Status).HasConversion<int>();
                e.HasOne(a => a.TravelPlan)
                 .WithMany(t => t.Activities)
                 .HasForeignKey(a => a.TravelPlanId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Expense>(e =>
            {
                e.HasKey(ex => ex.Id);
                e.Property(ex => ex.Name).IsRequired().HasMaxLength(200);
                e.Property(ex => ex.Amount).HasColumnType("decimal(18,2)");
                e.Property(ex => ex.Category).HasConversion<int>();
                e.HasOne(ex => ex.TravelPlan)
                 .WithMany(t => t.Expenses)
                 .HasForeignKey(ex => ex.TravelPlanId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ChecklistItem>(e =>
            {
                e.HasKey(c => c.Id);
                e.Property(c => c.Name).IsRequired().HasMaxLength(300);
                e.HasOne(c => c.TravelPlan)
                 .WithMany(t => t.ChecklistItems)
                 .HasForeignKey(c => c.TravelPlanId)
                 .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}