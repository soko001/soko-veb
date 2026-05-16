using Microsoft.EntityFrameworkCore;
using SharingService.Models;

namespace SharingService.Data
{
    public class SharingDbContext : DbContext
    {
        public SharingDbContext(DbContextOptions<SharingDbContext> options) : base(options) { }

        public DbSet<ShareToken> ShareTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ShareToken>(e =>
            {
                e.HasKey(s => s.Id);
                e.Property(s => s.Token).IsRequired().HasMaxLength(100);
                e.HasIndex(s => s.Token).IsUnique();
                e.Property(s => s.AccessLevel).HasConversion<int>();
            });
        }
    }
}