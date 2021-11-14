import { HttpClient } from '@angular/common/http';

import {
  AuthenticationResult,
  EventMessage,
  EventType,
} from '@azure/msal-browser';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { InteractionRequiredAuthError } from 'msal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'My Microsoft Login- Example';
  private readonly _destroying$ = new Subject<void>();
  apiResponse: string;

  constructor(
    private authService: MsalService,
    private broadcastService: MsalBroadcastService,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    this.authService.instance.handleRedirectPromise().then((res) => {
      if (res != null && res.account != null) {
        this.authService.instance.setActiveAccount(res.account);
      }
    });

    this.broadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        console.log(result);
      });
  }

  isLoggedIn(): boolean {
    return this.authService.instance.getActiveAccount() != null;
  }

  login(): void {
    this.authService
      .loginPopup()
      .subscribe((response: AuthenticationResult) => {
        this.authService.instance.setActiveAccount(response.account);
      });
  }

  logout(): void {
    this.authService.logout();
  }

  getName(): string {
    if (this.authService.instance.getActiveAccount() == null) {
      return 'unknown';
    }

    return this.authService.instance.getActiveAccount().username;
  }

  callProfile(): void {
    this.http.get('https://graph.microsoft.com/v1.0/me').subscribe((resp) => {
      this.apiResponse = JSON.stringify(resp);
    });
  }

  callEmails(): void {
    this.http
      .get('https://graph.microsoft.com/v1.0/me/messages')
      .subscribe((resp) => {
        this.apiResponse = JSON.stringify(resp);
      });
  }
  callStorage(): void {
    this.http
      .get('https://storage.azure.com/user_impersonation')
      .subscribe((resp) => {
        this.apiResponse = JSON.stringify(resp);
      });
  }
  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  getToken(): void {
    const account = this.authService.instance.getAllAccounts()[0];

    const accessTokenRequest = {
      scopes: ['user.read'],
      account,
    };

    this.authService.instance
      .acquireTokenSilent(accessTokenRequest)
      .then((accessTokenResponse) => {
        // Acquire token silent success
        const accessToken = accessTokenResponse.accessToken;
        // Call your API with token
        console.log(accessToken);
      })
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          this.authService.instance
            .acquireTokenPopup(accessTokenRequest)
            .then((accessTokenResponse) => {
              // Acquire token interactive success
              const accessToken = accessTokenResponse.accessToken;
              // Call your API with token
              console.log(accessToken);
            })
            .catch((err) => {
              // Acquire token interactive failure
              console.log(err);
            });
        }
        console.log(error);
      });
  }
  gitSearch(): void {
    this.http
      .get('https://api.github.com/orgs/AzureAD/repos')
      .subscribe((res) => console.log(res));
  }
}
