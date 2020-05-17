import { Component, OnInit } from '@angular/core';

import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export class Notification {
  public title: string;
  public body: string;
  public icon?: string;
  public url: string;
  public vibrate?: number[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // https://blog.angular-university.io/angular-push-notifications/

  // Test API connection
  public test = false;

  // Checkbox to ask for permission to send notifications
  public receiveNotifications = false;

  public notification: Notification = {
    title: 'Hi!',
    body: 'This is a test 😎',
    icon: null,
    url: window.origin,
    vibrate: [100, 50, 100],
  };

  // VAPID key
  // Generation: npm install web-push -g; web-push generate-vapid-keys --json
  // WARNING: The privateKey should be only on the server!
  public vapid = {
    publicKey:
      'BAmiyNqw0uh8ua4yIri346YmZJfh2TPie0p1rICuiSXSkVZSMJyhr0GI_8Km2sRlPNMSJtRktOdBa7ASGllkajU',
    // privateKey: 'xxxxx',
  };

  // Requested subscription
  public subscription: PushSubscription | void;

  constructor(private swPush: SwPush, private http: HttpClient) {}

  ngOnInit(): void {
    this.testAPIConnection();
  }

  public testAPIConnection(): void {
    this.http.get(`${environment.api}/test`).subscribe(
      () => {
        this.test = true;
      },
      () => {
        this.test = false;
      }
    );
  }

  public async toggledReceiveNotifications(): Promise<void> {
    console.log('toggledReceiveNotifications()');

    console.log(this.receiveNotifications);

    if (this.receiveNotifications) {
      if (!this.swPush.isEnabled) {
        console.log('Service worker not enabled');
        return;
      }

      // Request a subscription
      this.subscription = await this.swPush
        .requestSubscription({
          serverPublicKey: this.vapid.publicKey,
        })
        .catch((error) =>
          console.error('Could not subscribe to notifications', error)
        );

      if (!this.subscription) {
        return;
      }

      console.log('Requested subscription:');
      console.log(this.subscription.toJSON());

      // Save subscription on API
      this.http
        .post(`${environment.api}/webpush/subscribe`, {
          endpoint: this.subscription.toJSON().endpoint,
          ...this.subscription.toJSON().keys,
        })
        .subscribe();

      // Listen for messages
      this.swPush.messages.subscribe((message: any) => {
        console.log('Message received from server:');
        console.log(message);

        navigator.serviceWorker.getRegistration().then((swRegistration) => {
          // If the message is a notification, show it
          if (message.notification) {
            const notification = message.notification;
            swRegistration.showNotification(notification.title, {
              body: notification.body,
            });
          }
        });
      });

      // React on notification clicks
      this.swPush.notificationClicks.subscribe((event: any) => {
        console.log('Notification clicked:');
        console.log(event.notification);

        window.open(event.notification.data.url, '_blank');
      });
    } else {
      if (this.subscription) {
        console.log('Existing subscription:');
        console.log(this.subscription.toJSON());

        // Unsubscribe
        this.subscription.unsubscribe();

        // Remove subscription
        this.http
          .post(environment.api + '/webpush/unsubscribe', {
            endpoint: this.subscription.toJSON().endpoint,
            ...this.subscription.toJSON().keys,
          })
          .subscribe();
      }
    }
  }

  public sendNotificationFromBackend(): void {
    this.http
      .post(`${environment.api}/webpush/send-notification`, this.notification)
      .subscribe();
  }
}
