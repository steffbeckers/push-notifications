using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using PushNotifications.Models;
using WebPush;

namespace PushNotifications.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebPushController : ControllerBase
    {
        private readonly IConfiguration configuration;
        // TODO: Subscriptions should be stored in a database, ofcourse
        public static List<PushSubscription> subscriptions { get; set; } = new List<PushSubscription>();

        public WebPushController(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        [HttpPost]
        [Route("subscribe")]
        public void Subscribe([FromBody] PushSubscription subscription)
        {
            subscriptions.Add(subscription);
        }

        [HttpPost]
        [Route("unsubscribe")]
        public void Unsubscribe([FromBody] PushSubscription subscription)
        {
            PushSubscription existingSubscription = subscriptions.FirstOrDefault(s => s.Endpoint == subscription.Endpoint);
            if (existingSubscription != null)
            {
                subscriptions.Remove(existingSubscription);
            }
        }

        [HttpPost]
        [Route("send-notification")]
        public IActionResult SendNotification([FromBody] Notification notification)
        {
            // Validation
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // VAPID keys
            string vapidPublicKey = this.configuration.GetSection("VapidKeys")["PublicKey"];
            string vapidPrivateKey = this.configuration.GetSection("VapidKeys")["PrivateKey"];
            VapidDetails vapidDetails = new VapidDetails("mailto:steff@steffbeckers.eu", vapidPublicKey, vapidPrivateKey);

            // Web push the notification to all subscriptions
            WebPushClient webPushClient = new WebPushClient();
            foreach (PushSubscription subscription in subscriptions)
            {
                webPushClient.SendNotification(
                    subscription,
                    JsonConvert.SerializeObject(new {
                        notification = new {
                            title = notification.Title,
                            body = notification.Body,
                            icon = notification.Icon,
                            vibrate = notification.Vibrate,
                            data = new
                            {
                                url = notification.URL
                            }
                        }
                    }),
                    vapidDetails
                );
            }

            return Ok();
        }
    }
}