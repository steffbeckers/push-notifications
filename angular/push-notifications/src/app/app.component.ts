import { Component, OnInit } from '@angular/core';

import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // https://blog.angular-university.io/angular-push-notifications/

  // Checkbox to ask for permission to send notifications
  public receiveNotifications = false;

  // VAPID key
  // Generation: npm install web-push -g; web-push generate-vapid-keys --json
  // WARNING: The privateKey should be only on the server!
  public vapid = {
    publicKey:
      'BAmiyNqw0uh8ua4yIri346YmZJfh2TPie0p1rICuiSXSkVZSMJyhr0GI_8Km2sRlPNMSJtRktOdBa7ASGllkajU',
    // privateKey: 'xxxxx',
  };

  // Requested subscription
  public subscription: any;

  constructor(private swPush: SwPush, private http: HttpClient) {}

  ngOnInit(): void {}

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
      console.log(this.subscription);

      // TODO: Send the subscription to the API
      // this.http
      //   .post(environment.api + '/subscribe', this.subscription)
      //   .subscribe();
    } else {
      if (this.subscription) {
        console.log('Existing subscription:');
        console.log(this.subscription);

        // TODO: Remove subscription?
        //   this.http
        //     .post(environment.api + '/unsubscribe', this.subscription)
        //     .subscribe();
      }
    }
  }

  public sendNotificationFromBackend(): void {
    console.log('sendNotificationFromBackend()');
  }
}
