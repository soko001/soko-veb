using System;
using System.Diagnostics;
using System.Threading;
using Microsoft.ServiceFabric.Services.Runtime;

namespace TravelService
{
    internal static class Program
    {
        private static void Main()
        {
            try
            {
                ServiceRuntime.RegisterServiceAsync("TravelServiceType",
                    context => new TravelService(context)).GetAwaiter().GetResult();

                ServiceEventSource.Current.ServiceTypeRegistered(
                    Process.GetCurrentProcess().Id, typeof(TravelService).Name);

                Thread.Sleep(Timeout.Infinite);
            }
            catch (Exception e)
            {
                ServiceEventSource.Current.ServiceHostInitializationFailed(e.ToString());
                throw;
            }
        }
    }
}