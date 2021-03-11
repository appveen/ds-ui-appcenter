import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';

import { ViewCollectionOfObjectsGridComponent } from "./view-collection-of-objects-grid.component";

@NgModule({
  declarations: [ViewCollectionOfObjectsGridComponent],
  imports: [
    CommonModule,
    AgGridModule,
  ],
  exports: [ViewCollectionOfObjectsGridComponent]
})
export class ViewCollectionOfObjectsGridModule { }
