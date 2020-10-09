import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataGridDirective } from './data-grid.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [DataGridDirective],
  exports: [DataGridDirective]
})
export class DataGridModule { }
