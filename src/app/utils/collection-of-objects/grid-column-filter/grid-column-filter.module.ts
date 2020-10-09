import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { FloatingFilterComponent } from './floating-filter/floating-filter.component';
import { ColumnFilterComponent } from './column-filter/column-filter.component';

@NgModule({
  declarations: [FloatingFilterComponent, ColumnFilterComponent],
  imports: [
    CommonModule,
    FormsModule,
    OnChangeModule
  ],
  exports: [FloatingFilterComponent, ColumnFilterComponent]
})
export class GridColumnFilterModule { }
