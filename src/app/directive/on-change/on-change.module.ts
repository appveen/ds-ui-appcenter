import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnChangeDirective } from './on-change.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [OnChangeDirective],
  exports: [OnChangeDirective]
})
export class OnChangeModule { }
