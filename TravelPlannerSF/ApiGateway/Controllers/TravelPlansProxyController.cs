using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace ApiGateway.Controllers
{
    [ApiController]
    [Route("api/travel-plans")]
    public class TravelPlansProxyController : ProxyControllerBase
    {
        public TravelPlansProxyController(IHttpProxyService proxy, IConfiguration config)
            : base(proxy, config["Services:TravelService"]) { }

        [HttpGet]
        public Task<IActionResult> GetAll() => Forward("api/travel-plans");

        [HttpGet("{id}")]
        public Task<IActionResult> GetById(int id) => Forward($"api/travel-plans/{id}");

        [HttpPost]
        public Task<IActionResult> Create() => Forward("api/travel-plans");

        [HttpPut("{id}")]
        public Task<IActionResult> Update(int id) => Forward($"api/travel-plans/{id}");

        [HttpDelete("{id}")]
        public Task<IActionResult> Delete(int id) => Forward($"api/travel-plans/{id}");

        // --- Destinations ---
        [HttpGet("{planId}/destinations")]
        public Task<IActionResult> GetDestinations(int planId) => Forward($"api/travel-plans/{planId}/destinations");

        [HttpGet("{planId}/destinations/{id}")]
        public Task<IActionResult> GetDestination(int planId, int id) => Forward($"api/travel-plans/{planId}/destinations/{id}");

        [HttpPost("{planId}/destinations")]
        public Task<IActionResult> CreateDestination(int planId) => Forward($"api/travel-plans/{planId}/destinations");

        [HttpPut("{planId}/destinations/{id}")]
        public Task<IActionResult> UpdateDestination(int planId, int id) => Forward($"api/travel-plans/{planId}/destinations/{id}");

        [HttpDelete("{planId}/destinations/{id}")]
        public Task<IActionResult> DeleteDestination(int planId, int id) => Forward($"api/travel-plans/{planId}/destinations/{id}");

        // --- Activities ---
        [HttpGet("{planId}/activities")]
        public Task<IActionResult> GetActivities(int planId) => Forward($"api/travel-plans/{planId}/activities");

        [HttpGet("{planId}/activities/{id}")]
        public Task<IActionResult> GetActivity(int planId, int id) => Forward($"api/travel-plans/{planId}/activities/{id}");

        [HttpPost("{planId}/activities")]
        public Task<IActionResult> CreateActivity(int planId) => Forward($"api/travel-plans/{planId}/activities");

        [HttpPut("{planId}/activities/{id}")]
        public Task<IActionResult> UpdateActivity(int planId, int id) => Forward($"api/travel-plans/{planId}/activities/{id}");

        [HttpDelete("{planId}/activities/{id}")]
        public Task<IActionResult> DeleteActivity(int planId, int id) => Forward($"api/travel-plans/{planId}/activities/{id}");

        // --- Expenses ---
        [HttpGet("{planId}/expenses")]
        public Task<IActionResult> GetExpenses(int planId) => Forward($"api/travel-plans/{planId}/expenses");

        [HttpGet("{planId}/expenses/{id}")]
        public Task<IActionResult> GetExpense(int planId, int id) => Forward($"api/travel-plans/{planId}/expenses/{id}");

        [HttpPost("{planId}/expenses")]
        public Task<IActionResult> CreateExpense(int planId) => Forward($"api/travel-plans/{planId}/expenses");

        [HttpPut("{planId}/expenses/{id}")]
        public Task<IActionResult> UpdateExpense(int planId, int id) => Forward($"api/travel-plans/{planId}/expenses/{id}");

        [HttpDelete("{planId}/expenses/{id}")]
        public Task<IActionResult> DeleteExpense(int planId, int id) => Forward($"api/travel-plans/{planId}/expenses/{id}");

        // --- Checklist ---
        [HttpGet("{planId}/checklist")]
        public Task<IActionResult> GetChecklist(int planId) => Forward($"api/travel-plans/{planId}/checklist");

        [HttpGet("{planId}/checklist/{id}")]
        public Task<IActionResult> GetChecklistItem(int planId, int id) => Forward($"api/travel-plans/{planId}/checklist/{id}");

        [HttpPost("{planId}/checklist")]
        public Task<IActionResult> CreateChecklistItem(int planId) => Forward($"api/travel-plans/{planId}/checklist");

        [HttpPut("{planId}/checklist/{id}")]
        public Task<IActionResult> UpdateChecklistItem(int planId, int id) => Forward($"api/travel-plans/{planId}/checklist/{id}");

        [HttpDelete("{planId}/checklist/{id}")]
        public Task<IActionResult> DeleteChecklistItem(int planId, int id) => Forward($"api/travel-plans/{planId}/checklist/{id}");
    
        [HttpGet("/api/admin/travel-plans")]
        public Task<IActionResult> AdminGetAll() => Forward("api/admin/travel-plans");

        [HttpGet("/api/admin/travel-plans/{id}")]
        public Task<IActionResult> AdminGetById(int id) => Forward($"api/admin/travel-plans/{id}");

        [HttpDelete("/api/admin/travel-plans/{id}")]
        public Task<IActionResult> AdminDelete(int id) => Forward($"api/admin/travel-plans/{id}");
    }
}