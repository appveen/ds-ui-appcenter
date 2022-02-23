import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeViewComponent } from './tree-view.component';
import {MatTreeModule} from '@angular/material/tree';
import {MatIconModule} from '@angular/material/icon';
import { CdkTreeModule } from '@angular/cdk/tree';

@NgModule({
  declarations: [TreeViewComponent],
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    CdkTreeModule
  ],
  exports: [TreeViewComponent]
})
export class TreeViewModule { }
