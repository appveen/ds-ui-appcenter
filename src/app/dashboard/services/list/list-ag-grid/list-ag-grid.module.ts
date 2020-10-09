import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { ListAgGridComponent } from './list-ag-grid.component';
import { AgGridFiltersComponent } from './ag-grid-filters/ag-grid-filters.component';
import { OnChangeModule } from 'src/app/directive/on-change/on-change.module';
import { AgGridCellComponent } from './ag-grid-cell/ag-grid-cell.component';
import { RoundCheckModule } from 'src/app/utils/round-check/round-check.module';
import { RelationTooltipComponent } from './ag-grid-cell/relation-tooltip/relation-tooltip.component';
import { ListAgGridService } from './list-ag-grid.service';
import { RelationViewModule } from 'src/app/utils/relation-view/relation-view.module';
import { UserViewModule } from 'src/app/utils/user-view/user-view.module';
import { FileViewModule } from 'src/app/utils/file-view/file-view.module';

@NgModule({
  declarations: [
    ListAgGridComponent,
    AgGridFiltersComponent,
    AgGridCellComponent,
    RelationTooltipComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AgGridModule.withComponents([
      AgGridFiltersComponent,
      AgGridCellComponent,
      RelationTooltipComponent
    ]),
    OnChangeModule,
    RoundCheckModule,
    RouterModule,
    PdfViewerModule,
    RelationViewModule,
    UserViewModule,
    FileViewModule
  ],
  exports: [ListAgGridComponent],
  providers: [ListAgGridService]
})
export class ListAgGridModule { }
