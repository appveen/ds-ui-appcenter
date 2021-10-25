import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowRespondViewComponent } from './workflow-respond-view.component';
import { PipesModule } from 'src/app/pipes/pipes.module';



@NgModule({
  declarations: [WorkflowRespondViewComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    PipesModule
  ],
  exports: [
    WorkflowRespondViewComponent
  ]
})
export class WorkflowRespondViewModule { }
