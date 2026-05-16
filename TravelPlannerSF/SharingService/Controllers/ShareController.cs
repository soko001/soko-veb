using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using SharingService.DTOs;
using SharingService.Services;

namespace SharingService.Controllers
{
    [ApiController]
    [Route("api/shares")]
    public class ShareController : ControllerBase
    {
        private readonly ISharingTokenService _service;

        public ShareController(ISharingTokenService service)
        {
            _service = service;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateShareTokenDto dto)
        {
            try
            {
                var result = await _service.CreateTokenAsync(GetUserId(), dto);
                return CreatedAtAction(nameof(GetTokensForPlan),
                    new { planId = result.TravelPlanId }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("validate")]
        public async Task<IActionResult> Validate([FromBody] ValidateShareTokenDto dto)
        {
            var result = await _service.ValidateTokenAsync(dto.Token);
            return Ok(result);
        }

        [HttpGet("plan/{planId}")]
        [Authorize]
        public async Task<IActionResult> GetTokensForPlan(int planId)
        {
            try
            {
                var result = await _service.GetTokensForPlanAsync(planId, GetUserId());
                return Ok(result);
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        [HttpDelete("{tokenId}")]
        [Authorize]
        public async Task<IActionResult> Revoke(int tokenId)
        {
            try
            {
                await _service.RevokeTokenAsync(tokenId, GetUserId());
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub") ?? "0");
    }
}