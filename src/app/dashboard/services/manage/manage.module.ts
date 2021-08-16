import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';
import { ManageControlModule } from 'src/app/utils/manage-control/manage-control.module';
import { ManageComponent } from 'src/app/dashboard/services/manage/manage.component';
import { MapModule } from 'src/app/utils/map/map.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ManageGuard } from 'src/app/guard/manage.guard';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';
import { RouteGuard } from 'src/app/guard/route.guard';
import { LoadingPlaceholderModule } from 'src/app/utils/loading-placeholder/loading-placeholder.module';
import { SearchTermDirective } from './search-term.directive';
import { SearchTermPipe } from './search-term.pipe';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: ManageComponent, canActivate: [ManageGuard] , canDeactivate: [RouteGuard]},
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    NgbModule,
    DatePickerModule,
    ManageControlModule,
    MapModule,
    PipesModule,
    ClickOutsideModule,
    LoadingPlaceholderModule
  ],
  declarations: [
    ManageComponent,
    SearchTermDirective,
    SearchTermPipe
  ],
  exports: [
    RouterModule
  ]
})
export class ManageModule { }
