import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MapModule } from 'src/app/utils/map/map.module';
import { ProgressModule } from 'src/app/utils/progress/progress.module';
import { ManageControlComponent } from './manage-control.component';
import { LongTextComponent } from './long-text/long-text.component';
import { ArrayControlComponent } from './array-control/array-control.component';
import { DatePickerModule } from '../date-picker/date-picker.module';
import { BooleanTypeComponent } from './boolean-type/boolean-type.component';
import { DateTypeComponent } from './date-type/date-type.component';
import { FormControlComponent } from './form-control/form-control.component';
import { NumberTypeComponent } from './number-type/number-type.component';
import { FileTypeComponent } from './file-type/file-type.component';
import { RelationTypeComponent } from './relation-type/relation-type.component';
import { RichTextComponent } from './rich-text/rich-text.component';
import { TextTypeComponent } from './text-type/text-type.component';
import { TruncatedModule } from 'src/app/utils/truncated/truncated.module';
import { UserTypeComponent } from './user-type/user-type.component';
import { SecureTextTypeComponent } from './secure-text-type/secure-text-type.component';
import { EditColOfObjsComponent } from '../collection-of-objects/edit-col-of-objs/edit-col-of-objs.component';
import { EditCollectionOfObjectsGridComponent } from '../collection-of-objects/edit-collection-of-objects-grid/edit-collection-of-objects-grid.component';
import { RoundCheckModule } from '../round-check/round-check.module';
import { GridCheckboxComponent } from "../collection-of-objects/grid-checkbox/grid-checkbox.component";
import { ColOfObjsGridCellComponent } from '../collection-of-objects/col-of-objs-grid-cell/col-of-objs-grid-cell/col-of-objs-grid-cell.component';
import { ColOfObjsGridCellModule } from '../collection-of-objects/col-of-objs-grid-cell/col-of-objs-grid-cell.module';
import { GridColumnFilterModule } from '../collection-of-objects/grid-column-filter/grid-column-filter.module';
import { LoadingPlaceholderModule } from '../loading-placeholder/loading-placeholder.module';
import { FloatingFilterComponent } from '../collection-of-objects/grid-column-filter/floating-filter/floating-filter.component';
import { ColumnFilterComponent } from '../collection-of-objects/grid-column-filter/column-filter/column-filter.component';
import { ViewCollectionOfObjectsGridModule } from '../collection-of-objects/view-collection-of-objects-grid/view-collection-of-objects-grid.module';
import { ColOfObjsHeaderCellModule } from '../collection-of-objects/col-of-objs-header-cell/col-of-objs-header-cell.module';
import { RouterModule } from '@angular/router';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { TextEditor } from '../cell-editor/text-editor.component';
import { SelectEditor } from '../cell-editor/select-editor.component';
import { ViewControlModule } from '../view-control/view-control.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    MapModule,
    DatePickerModule,
    ProgressModule,
    TruncatedModule,
    RoundCheckModule,
    ColOfObjsGridCellModule,
    ColOfObjsHeaderCellModule,
    GridColumnFilterModule,
    LoadingPlaceholderModule,
    ViewCollectionOfObjectsGridModule,
    AgGridModule,
    RouterModule,
    PipesModule,
    ViewControlModule
  ],
  declarations: [
    ManageControlComponent,
    BooleanTypeComponent,
    DateTypeComponent,
    FileTypeComponent,
    FormControlComponent,
    NumberTypeComponent,
    RelationTypeComponent,
    RichTextComponent,
    TextTypeComponent,
    LongTextComponent,
    ArrayControlComponent,
    UserTypeComponent,
    SecureTextTypeComponent,
    EditCollectionOfObjectsGridComponent,
    TextEditor,
    SelectEditor,
    EditColOfObjsComponent,
    GridCheckboxComponent
  ],
  exports: [
    ManageControlComponent,
    BooleanTypeComponent,
    DateTypeComponent,
    FileTypeComponent,
    FormControlComponent,
    NumberTypeComponent,
    RelationTypeComponent,
    RichTextComponent,
    TextTypeComponent,
    LongTextComponent,
    ArrayControlComponent,
    UserTypeComponent,
    SecureTextTypeComponent
  ]
})
export class ManageControlModule { }
