import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ColOfObjsHeaderCellComponent } from './col-of-objs-header-cell/col-of-objs-header-cell.component';

@NgModule({
  declarations: [ColOfObjsHeaderCellComponent],
  imports: [
    CommonModule,
    NgbModule
  ],
  exports: [ColOfObjsHeaderCellComponent]
})
export class ColOfObjsHeaderCellModule { }
