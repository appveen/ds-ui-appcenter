import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, enableProdMode, ErrorHandler } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { SortablejsModule } from 'ngx-sortablejs';
import { CookieService } from 'ngx-cookie-service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { AppService } from './service/app.service';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthComponent } from './auth/auth.component';
import { AppRoutingModule } from './app-routing.module';
import { CommonService } from './service/common.service';
import { ErrorService } from './service/error.service';
import { ProfileComponent } from './dashboard/profile/profile.component';
import { ShortcutModule } from './shortcut/shortcut.module';
import { FormService } from './service/form.service';
import { RouteGuard } from './guard/route.guard';
import { AuthGuard } from './guard/auth.guard';
import { LoadingComponent } from './utils/loading/loading.component';
import { ThemeService } from './service/theme.service';
import { NotFoundComponent } from './not-found/not-found.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { NoServicesComponent } from 'src/app/dashboard/services/no-services/no-services.component';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { LogoModule } from 'src/app/utils/logo/logo.module';
import { AppSwitcherModule } from 'src/app/utils/app-switcher/app-switcher.module';
import { IconsModule } from 'src/app/utils/icons/icons.module';
import { ChangePasswordModule } from './utils/change-password/change-password.module';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { ReqResInterceptorService } from './service/req-res-interceptor.service';
import { TruncatedModule } from './utils/truncated/truncated.module';
import { DomService } from './service/dom.service';
import { PreferenceService } from './preference.service';
import { NotificationItemComponent } from './dashboard/notification-item/notification-item.component';
import { DashboardMenuComponent } from './dashboard/dashboard-menu/dashboard-menu.component';
import { ServiceListComponent } from './dashboard/dashboard-menu/service-list/service-list.component';
import { WorkflowListComponent } from './dashboard/dashboard-menu/workflow-list/workflow-list.component';
import { BookmarkListComponent } from './dashboard/dashboard-menu/bookmark-list/bookmark-list.component';
import { IntegrationListComponent } from './dashboard/dashboard-menu/integration-list/integration-list.component';
import { DashboardService } from './dashboard/dashboard.service';

// enableProdMode();

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AuthComponent,
    ProfileComponent,
    LoadingComponent,
    NoServicesComponent,
    NotFoundComponent,
    NotificationItemComponent,
    DashboardMenuComponent,
    ServiceListComponent,
    WorkflowListComponent,
    BookmarkListComponent,
    IntegrationListComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-center',
      maxOpened: 2,
      autoDismiss: true,
      preventDuplicates: true,
      newestOnTop: false
    }),
    ShortcutModule,
    PipesModule,
    ClickOutsideModule,
    LogoModule,
    AppSwitcherModule,
    IconsModule,
    ChangePasswordModule,
    AutoFocusModule,
    SortablejsModule.forRoot({ animation: 150 }),
    TruncatedModule,
    PdfViewerModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: ErrorService },
    AppService,
    CommonService,
    FormService,
    ThemeService,
    RouteGuard,
    AuthGuard,
    CookieService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ReqResInterceptorService,
      multi: true
    },
    DomService,
    PreferenceService,
    DashboardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
