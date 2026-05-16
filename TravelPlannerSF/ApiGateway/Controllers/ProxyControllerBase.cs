using ApiGateway.Services;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace ApiGateway.Controllers
{
    public abstract class ProxyControllerBase : ControllerBase
    {
        private readonly IHttpProxyService _proxy;
        private readonly string _serviceBaseUrl;

        protected ProxyControllerBase(IHttpProxyService proxy, string serviceBaseUrl)
        {
            _proxy = proxy;
            _serviceBaseUrl = serviceBaseUrl;
        }

        protected async Task<IActionResult> Forward(string targetPath)
        {
            var response = await _proxy.ForwardAsync(Request, _serviceBaseUrl, targetPath);
            var content = await response.Content.ReadAsStringAsync();

            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                Content = content,
                ContentType = "application/json"
            };
        }
    }
}