import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePickerComponent } from 'src/app/utils/date-picker/date-picker.component';
import { ClickOutsideModule } from 'src/app/directive/click-outside/click-outside.module';

@NgModule({
  imports: [
    CommonModule,
    ClickOutsideModule
  ],
  declarations: [
    DatePickerComponent
  ],
  exports: [
    DatePickerComponent
  ]
})
export class DatePickerModule { }
