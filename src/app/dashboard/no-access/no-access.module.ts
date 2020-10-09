import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoAccessComponent } from './no-access.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: NoAccessComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [NoAccessComponent],
  exports: [NoAccessComponent]
})
export class NoAccessModule { }
