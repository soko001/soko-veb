using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace ApiGateway.Controllers
{
    [ApiController]
    [Route("api/shares")]
    public class SharesProxyController : ProxyControllerBase
    {
        public SharesProxyController(IHttpProxyService proxy, IConfiguration config)
            : base(proxy, config["Services:SharingService"]) { }

        [HttpPost]
        public Task<IActionResult> Create() => Forward("api/shares");

        [HttpPost("validate")]
        public Task<IActionResult> Validate() => Forward("api/shares/validate");

        [HttpGet("plan/{planId}")]
        public Task<IActionResult> GetForPlan(int planId) => Forward($"api/shares/plan/{planId}");

        [HttpDelete("{tokenId}")]
        public Task<IActionResult> Revoke(int tokenId) => Forward($"api/shares/{tokenId}");
    }
}