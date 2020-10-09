import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";

import { RelationViewComponent } from './relation-view.component'

@NgModule({
  declarations: [RelationViewComponent],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [RelationViewComponent]
})
export class RelationViewModule { }
