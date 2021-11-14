import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  MsalModule,
  MsalService,
  MSAL_INSTANCE,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import {
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication,
} from '@azure/msal-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PublicPageComponent } from './public-page/public-page.component';
import { RestrictedPageComponent } from './restricted-page/restricted-page.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '87e8dac9-510d-4444-992d-65cf33cdcf65',
      redirectUri: 'http://localhost:4200',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', [
    'user.read',
    'mail.read',
  ]);
  protectedResourceMap.set('https://storage.azure.com/user_impersonation', [
    'user.read',
  ]);

  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap,
  };
}

@NgModule({
  declarations: [AppComponent, PublicPageComponent, RestrictedPageComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MsalModule,
    HttpClientModule,
    MsalModule.forRoot(
      new PublicClientApplication({
        auth: {
          clientId: '87e8dac9-510d-4444-992d-65cf33cdcf65',
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false,
        },
      }),
      {
        interactionType: InteractionType.Popup,
        authRequest: {
          scopes: ['user.read'],
        },
      },
      {
        interactionType: InteractionType.Popup,
        protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me', ['user.read']],
        ]),
      }
    ),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
