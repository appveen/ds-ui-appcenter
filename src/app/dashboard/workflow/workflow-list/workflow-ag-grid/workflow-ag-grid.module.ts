import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowAgGridComponent } from './workflow-ag-grid.component';
import { AgGridModule } from 'ag-grid-angular';
import { AgGridCellComponent } from './ag-grid-cell/ag-grid-cell.component';
import { RoundCheckModule } from 'src/app/utils/round-check/round-check.module';
import { AgGridFiltersComponent } from './ag-grid-filters/ag-grid-filters.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { FileViewComponent } from './ag-grid-cell/file-view/file-view.component';
import { RelationViewComponent } from './ag-grid-cell/relation-view/relation-view.component';
import { UserViewComponent } from './ag-grid-cell/user-view/user-view.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    WorkflowAgGridComponent,
    AgGridCellComponent,
    AgGridFiltersComponent,
    FileViewComponent,
    RelationViewComponent,
    UserViewComponent,
  ],
  imports: [
    CommonModule,
    RoundCheckModule,
    FormsModule,
    NgbModule,
    OnChangeModule,
    PdfViewerModule,
    RouterModule,
    // ReactiveFormsModule,
    AgGridModule.withComponents([
      AgGridFiltersComponent,
      AgGridCellComponent,
    ]),
  ],
  exports: [WorkflowAgGridComponent]

})
export class WorkflowAgGridModule { }
