import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthComponent } from 'src/app/auth/auth.component';
import { DashboardComponent } from 'src/app/dashboard/dashboard.component';
import { ProfileComponent } from 'src/app/dashboard/profile/profile.component';
import { NotFoundComponent } from 'src/app/not-found/not-found.component';
import { NoServicesComponent } from 'src/app/dashboard/services/no-services/no-services.component';
import { BeforeGuard } from './guard/before.guard';


const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth' },
  // { path: 'auth', component: AuthComponent, canActivate: [AuthGuard] },x
  { path: 'auth', component: AuthComponent },
  {
    path: ':app', component: DashboardComponent,
    canActivateChild: [BeforeGuard],
    canActivate: [BeforeGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'services' },
      { path: 'profile', component: ProfileComponent },
      { path: 'services', loadChildren: () => import('src/app/dashboard/services/services.module').then(m => m.ServicesModule) },
      { path: 'workflow', loadChildren: () => import('src/app/dashboard/workflow/workflow.module').then(m => m.WorkflowModule) },
      {
        path: 'interactions', loadChildren: () => import('src/app/dashboard/interactions/interactions.module')
          .then(m => m.InteractionsModule)
      },
      {
        path: 'bookmark', loadChildren: () => import('src/app/dashboard/bookmark-frame/bookmark-frame.module')
          .then(m => m.BookmarkFrameModule)
      },
      { path: 'no-access', loadChildren: () => import('src/app/dashboard/no-access/no-access.module').then(m => m.NoAccessModule) },
      { path: 'no-services', component: NoServicesComponent }
    ]
  },
  {
    path: '**', component: NotFoundComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, { useHash: true })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {

}
