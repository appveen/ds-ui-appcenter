import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoFocusDirective } from 'src/app/utils/directives/auto-focus/auto-focus.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [AutoFocusDirective],
  exports: [AutoFocusDirective]
})
export class AutoFocusModule { }
