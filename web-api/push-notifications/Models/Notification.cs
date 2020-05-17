using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PushNotifications.Models
{
    public class Notification
    {
        public string Title { get; set; }
        public string Body { get; set; }
        public string Icon { get; set; }
        public string URL { get; set; }
        public int[]? Vibrate { get; set; }
    }
}
