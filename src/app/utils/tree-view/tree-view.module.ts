import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeViewComponent } from './tree-view.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [TreeViewComponent],
  imports: [
    CommonModule,
    NgbModule
  ],
  exports: [TreeViewComponent]
})
export class TreeViewModule { }
