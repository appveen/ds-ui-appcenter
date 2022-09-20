import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FilemapperComponent } from './filemapper.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RoundCheckModule } from '../utils/round-check/round-check.module';
import { DragAndDropModule } from '../utils/directives/drag-and-drop/drag-and-drop.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ColumnMappingComponent } from './column-mapping/column-mapping.component';
import { ColumnMappingControlComponent } from './column-mapping-control/column-mapping-control.component';
import { ConflictResolveComponent } from './conflict-resolve/conflict-resolve.component';
import { DataGridModule } from '../utils/directives/data-grid/data-grid.module';
import { ViewControlComponent } from './conflict-resolve/view-control/view-control.component';
import { TruncatedModule } from '../utils/truncated/truncated.module';
import { DuplicateResolveComponent } from './duplicate-resolve/duplicate-resolve.component';
import { ErrorRecordsComponent } from './error-records/error-records.component';
import { ValidationResultComponent } from './validation-result/validation-result.component';
import { AgGridModule } from 'ag-grid-angular';
import { ValueRendererComponent } from './value-renderer/value-renderer.component';
import { ResolveCellComponent } from './resolve-cell/resolve-cell.component';
import { ValidRecordsComponent } from './valid-records/valid-records.component';
import { FieldTypeModule } from '../utils/field-type/field-type.module';
const routes: Routes = [
  {
    path: '', component: FilemapperComponent, data: {
      breadcrumb: ['Data Service']
    }
  },
];

@NgModule({
  imports: [
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    RoundCheckModule,
    DragAndDropModule,
    DataGridModule,
    TruncatedModule,
    AgGridModule.withComponents([
      ValueRendererComponent,
      ResolveCellComponent
    ]),
    FieldTypeModule
  ],
  declarations: [
    FilemapperComponent,
    ColumnMappingComponent,
    ColumnMappingControlComponent,
    ConflictResolveComponent,
    ViewControlComponent,
    DuplicateResolveComponent,
    ErrorRecordsComponent,
    ValidationResultComponent,
    ValueRendererComponent,
    ResolveCellComponent,
    ValidRecordsComponent
  ],
  bootstrap: [FilemapperComponent]

})
export class FilemapperModule { }
