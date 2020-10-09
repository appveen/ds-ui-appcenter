import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";

import { ColOfObjsGridCellComponent } from './col-of-objs-grid-cell/col-of-objs-grid-cell.component';
import { RelationViewModule } from '../../relation-view/relation-view.module';
import { UserViewModule } from '../../user-view/user-view.module';
import { FileViewModule } from '../../file-view/file-view.module';



@NgModule({
  declarations: [ColOfObjsGridCellComponent],
  imports: [
    CommonModule,
    RouterModule,
    RelationViewModule,
    UserViewModule,
    FileViewModule
  ],
  exports: [ColOfObjsGridCellComponent]
})
export class ColOfObjsGridCellModule { }
