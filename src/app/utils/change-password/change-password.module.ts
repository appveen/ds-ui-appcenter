import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { ChangePasswordComponent } from './change-password.component';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';

@NgModule({
  imports: [
    CommonModule,
    NgbModule,
    ReactiveFormsModule,
    AutoFocusModule
  ],
  declarations: [ChangePasswordComponent],
  exports: [ChangePasswordComponent]
})
export class ChangePasswordModule { }
