import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowRemarksViewComponent } from './workflow-remarks-view.component';



@NgModule({
  declarations: [WorkflowRemarksViewComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule
  ],
  exports: [WorkflowRemarksViewComponent]
})
export class WorkflowRemarksViewModule { }
