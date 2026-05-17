using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace ApiGateway.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersProxyController : ProxyControllerBase
    {
        public UsersProxyController(IHttpProxyService proxy, IConfiguration config)
            : base(proxy, config["Services:UserService"]) { }

        [HttpGet("{id}")]
        public Task<IActionResult> GetById(int id) => Forward($"api/users/{id}");

        [HttpGet]
        public Task<IActionResult> GetAll() => Forward("api/users");

        [HttpPut("{id}")]
        public Task<IActionResult> Update(int id) => Forward($"api/users/{id}");

        [HttpDelete("{id}")]
        public Task<IActionResult> Delete(int id) => Forward($"api/users/{id}");
    }
}