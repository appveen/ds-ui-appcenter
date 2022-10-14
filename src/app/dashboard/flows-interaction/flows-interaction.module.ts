import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FlowsInteractionComponent } from './flows-interaction.component';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';

import { FlowsInteractionViewComponent } from './flows-interaction-view/flows-interaction-view.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { FlowsInteractionService } from './flows-interaction.service';
import { FlowNodeViewComponent } from './flows-interaction-view/flow-node-view/flow-node-view.component';

const routes: Routes = [
  { path: ':flowId', pathMatch: 'full', component: FlowsInteractionComponent },
  { path: ':flowId/:interactionId', component: FlowsInteractionViewComponent }
];

@NgModule({
  declarations: [
    FlowsInteractionComponent,
    FlowsInteractionViewComponent,
    FlowNodeViewComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    PipesModule,
    AgGridModule
  ],
  providers: [FlowsInteractionService]
})
export class FlowsInteractionModule { }
