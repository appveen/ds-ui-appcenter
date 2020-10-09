import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FindAxisDirective } from './find-axis.directive';



@NgModule({
  declarations: [FindAxisDirective],
  imports: [
    CommonModule
  ],
  exports: [
    FindAxisDirective
  ]
})
export class FindAxisModule { }
