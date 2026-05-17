using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace ApiGateway.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthProxyController : ProxyControllerBase
    {
        public AuthProxyController(IHttpProxyService proxy, IConfiguration config)
            : base(proxy, config["Services:UserService"]) { }

        [HttpPost("register")]
        public Task<IActionResult> Register() => Forward("api/auth/register");

        [HttpPost("login")]
        public Task<IActionResult> Login() => Forward("api/auth/login");

        [HttpPost("validate-token")]
        public Task<IActionResult> ValidateToken() => Forward("api/auth/validate-token");
    }
}