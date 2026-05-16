using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace ApiGateway.Services
{
    public interface IHttpProxyService
    {
        Task<HttpResponseMessage> ForwardAsync(HttpRequest incomingRequest, string targetBaseUrl, string targetPath);
    }

    public class HttpProxyService : IHttpProxyService
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public HttpProxyService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<HttpResponseMessage> ForwardAsync(
            HttpRequest incomingRequest, string targetBaseUrl, string targetPath)
        {
            var client = _httpClientFactory.CreateClient();

            var queryString = incomingRequest.QueryString.Value ?? string.Empty;
            var targetUrl = $"{targetBaseUrl.TrimEnd('/')}/{targetPath.TrimStart('/')}{queryString}";

            var requestMessage = new HttpRequestMessage
            {
                Method = new HttpMethod(incomingRequest.Method),
                RequestUri = new Uri(targetUrl)
            };

            if (incomingRequest.Method != HttpMethods.Get &&
                incomingRequest.Method != HttpMethods.Delete)
            {
                var body = await new StreamReader(incomingRequest.Body).ReadToEndAsync();
                requestMessage.Content = new StringContent(body,
                    System.Text.Encoding.UTF8, "application/json");
            }

            if (incomingRequest.Headers.ContainsKey("Authorization"))
            {
                requestMessage.Headers.TryAddWithoutValidation(
                    "Authorization", incomingRequest.Headers["Authorization"].ToString());
            }

            return await client.SendAsync(requestMessage);
        }
    }
}