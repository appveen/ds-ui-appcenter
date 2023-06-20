import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { GridOptions, ColDef, ColumnApi, GridApi } from 'ag-grid-community';
import { Component, OnInit, Input, TemplateRef, ViewChild, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter } from '@angular/core';

import {
  AG_GRID_FOOTER_HEIGHT,
  AG_GRID_HEADER_HEIGHT,
  AG_GRID_HSCROLL_HEIGHT,
  AG_GRID_NO_ROW_HEIGHT,
  AG_GRID_PAGINATION_COUNT,
  AG_GRID_ROW_HEIGHT,
  AG_GRID_DEFAULT_COLUMN_WIDTH
} from "../grid-constants";
import { FormService } from 'src/app/service/form.service';
import { GridCheckboxComponent } from '../grid-checkbox/grid-checkbox.component';
import { EditColOfObjsComponent } from '../edit-col-of-objs/edit-col-of-objs.component';
import { ColOfObjsGridCellComponent } from '../col-of-objs-grid-cell/col-of-objs-grid-cell/col-of-objs-grid-cell.component';
import { FloatingFilterComponent } from '../grid-column-filter/floating-filter/floating-filter.component';
import { ColumnFilterComponent } from '../grid-column-filter/column-filter/column-filter.component';
import { AppService } from 'src/app/service/app.service';
import { ColOfObjsHeaderCellComponent } from '../col-of-objs-header-cell/col-of-objs-header-cell/col-of-objs-header-cell.component';
import { TextEditor } from '../../cell-editor/text-editor.component';
import * as _ from 'lodash'
import { CommonService } from '../../../service/common.service';

@Component({
  selector: 'odp-edit-collection-of-objects-grid',
  templateUrl: './edit-collection-of-objects-grid.component.html',
  styleUrls: ['./edit-collection-of-objects-grid.component.scss']
})
export class EditCollectionOfObjectsGridComponent implements OnInit, OnChanges, OnDestroy {

  @Input() formArray: UntypedFormArray;
  @Input() definition: any;
  @Input() collectionFieldName: string;
  @Input() showIndexColumn: boolean = false;
  @Input() isEditable: boolean = false;
  @Output() modifyForm = new EventEmitter();
  @ViewChild('editModal', { static: false }) editModal: TemplateRef<HTMLElement>;
  @ViewChild('bulkEditModal', { static: false }) bulkEditModal: TemplateRef<HTMLElement>;
  @ViewChild('newModal', { static: false }) newModal: TemplateRef<HTMLElement>;
  editModalRef: NgbModalRef;
  bulkEditModalRef: NgbModalRef;
  newModalRef: NgbModalRef;
  editBackup: Array<any>;
  checkAll = false;
  gridOptions: GridOptions;
  modalOptions: GridOptions;
  definitionList: Array<any> = [];
  gridApi: GridApi;
  columnApi: ColumnApi;
  tempRowIndex = 0;
  addedIndex = null;
  selectedRowIndex = 0;
  bulkEditForm: UntypedFormGroup = null;
  frameworkComponents: any;
  showModalBackdrop = false;
  rowData;
  private addAllowed = true;
  editor: boolean;
  addRow: boolean;
  ogRowData: any;

  get rowCount() {
    return this.gridApi?.getDisplayedRowCount() || 0;
  }

  get isFormArrayValid() {
    return !!this.formArray && !!this.formArray.controls.length &&
      !this.formArray.controls.some(control => control.invalid)
  }

  get gridStyle() {
    return {
      minHeight: (AG_GRID_HEADER_HEIGHT + AG_GRID_NO_ROW_HEIGHT + AG_GRID_HSCROLL_HEIGHT + AG_GRID_FOOTER_HEIGHT) + 'px',
      height: (
        AG_GRID_HEADER_HEIGHT
        + (!!this.formArray && !!this.formArray.controls.length ? (Math.min(this.formArray.controls.length, AG_GRID_PAGINATION_COUNT) * AG_GRID_ROW_HEIGHT) : AG_GRID_NO_ROW_HEIGHT)
        + AG_GRID_HSCROLL_HEIGHT
        + AG_GRID_FOOTER_HEIGHT
      ) + 'px'
    }
  }

  get selectedRecordsCount(): number {
    return !!this.gridApi ? this.gridApi.getSelectedNodes().length : 0;
  }

  get isButtonsRowShown(): boolean {
    return !!this.gridApi && !!this.gridApi.getDisplayedRowCount();
  }

  get hasFilters() {
    return !!this.gridApi && this.gridApi.isAnyFilterPresent()
  }

  constructor(private ngbModal: NgbModal, private fb: UntypedFormBuilder, private formService: FormService, private appService: AppService, private commonService: CommonService) { }

  ngOnInit() {
    this.flattenDefinition(this.definitionList, this.definition.definition);
    this.prepareTable();
    this.openNew();
    this.handleSecure()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.formArray) {
      this.rowData = this.formArray?.value.map((v, i) => ({ ...v, __index: i + 1 }))
      setTimeout(e => {
        this.onGridSizeChanged()
      }, 100)
    }
  }

  ngOnDestroy() {
    if (!!this.editModalRef) {
      this.editModalRef.dismiss();
    }
    if (!!this.bulkEditModalRef) {
      this.bulkEditModalRef.dismiss();
    }
  }

  flattenDefinition(definitionList, definition, parent?) {
    const self = this;
    if (definition) {
      definition.forEach(def => {
        const tempDef = this.appService.cloneObject(def);
        const path = parent ? parent.path + '.' + tempDef.key : tempDef.key;
        const key = tempDef.key;
        const camelCase = path.split('.').join(' ').split('#').join(' ').camelCase();
        const level = parent ? tempDef.level + 1 : tempDef.level;
        const value = tempDef.value;
        const controlPath = parent ? parent.controlPath + '.' + tempDef.key : tempDef.key;
        tempDef.controlPath = controlPath;
        const properties = tempDef.properties;
        if (parent) {
          properties.name = parent.properties.name + '.' + properties.name;
        }
        if (tempDef.type === 'Object' && !tempDef.properties.schemaFree) {
          self.flattenDefinition(definitionList, tempDef.definition, tempDef);
        } else {
          definitionList.push({
            ...tempDef,
            controlPath,
            dataKey: controlPath,
            path,
            key,
            camelCase,
            type: tempDef.type,
            properties,
            level,
            value,
          });
        }
      });
    }
  }

  onSelectionChanged() {
    const rowData = [];
    this.gridApi.forEachNode(data => { rowData.push(data) });
    this.checkAll = !!rowData.length && this.gridApi.getSelectedNodes().length === rowData.length;
  }

  onRowAdded() {
    if (this.addAllowed) {
      const formGroupControl = this.getFormObject();
      formGroupControl.reset()
      if (!!this.gridApi) {
        let index = this.formArray.length;
        const selectedNodes = this.gridApi.getSelectedNodes();
        if (!!selectedNodes && !!selectedNodes.length) {
          index = selectedNodes[selectedNodes.length - 1].rowIndex + 1;
        }

        this.formArray.insert(index, formGroupControl);
        this.formArray.markAsDirty();
        this.selectedRowIndex = index;
        this.addedIndex = index;


        // if (this.addRow) {

        //   this.rowData.push(this.formArray.at(this.selectedRowIndex).value)
        //   this.gridApi.setRowData(this.rowData)
        //   this.gridApi.startEditingCell({
        //     rowIndex: this.selectedRowIndex,
        //     colKey: (this.gridOptions.columnApi.getDisplayedCenterColumns()[0]).getColId()
        //   })
        // }
        // else {
        this.editItem(true);
        // }

        const displayIndex = index + 1;
        let pageToGo = Math.floor(displayIndex / AG_GRID_PAGINATION_COUNT);
        if (displayIndex % AG_GRID_PAGINATION_COUNT !== 0) {
          pageToGo++;
        }
        const notSamePage = (this.gridApi.paginationGetCurrentPage() + 1) !== pageToGo;
        if (notSamePage) {
          this.gridApi.paginationGoToPage(pageToGo);
        }
      }
    }
  }

  selectAllRecords() {
    this.checkAll = !this.checkAll;
    if (!!this.gridApi) {
      if (this.checkAll) {
        this.gridApi.selectAll();
      } else {
        this.gridApi.getSelectedNodes().forEach(node => {
          node.setSelected(false);
        });
      }
    }
  }

  removeSelectedNodes() {
    if (!!this.gridApi) {
      const selectedNodes = this.gridApi.getSelectedNodes();
      const indexArray = selectedNodes.map(node => node.rowIndex);
      // this.gridApi.updateRowData({ remove: selectedNodes.map(node => node.data) });

      this.formArray = new UntypedFormArray(this.formArray.controls.filter((ctrl, index) => !indexArray.includes(index)));
      this.formArray.markAsDirty();
      this.rowData = this.formArray.value;
      this.modifyForm.emit(this.formArray.value);
      setTimeout(() => {
        this.refreshRowData();
      }, 500);
      // this.modifyForm.emit(this.formArray.value)
    }
  }

  removeItem(nodeData: any) {
    this.formArray.removeAt(this.selectedRowIndex);
    this.formArray.markAsDirty();
    this.gridApi.applyTransaction({ remove: [nodeData] });
    setTimeout(() => {
      this.refreshRowData();
    }, 500);
  }

  bulkEdit() {
    this.bulkEditForm = this.getFormObject();
    Object.keys(this.bulkEditForm.controls).forEach(key => {
      this.bulkEditForm.get(key).disable();
      this.bulkEditForm.get(key).updateValueAndValidity();
    });
    this.showModalBackdrop = true;
    this.bulkEditModalRef = this.ngbModal.open(this.bulkEditModal, { centered: true, backdrop: false, keyboard: false, windowClass: 'large-modal' })
    this.bulkEditModalRef.result.then(() => {
      this.bulkEditForm = null;
      this.refreshRowData();
      this.forceResizeColumns();
      this.showModalBackdrop = false;
    })
  }

  onBulkEditConfirm() {
    const selectedNodes = this.gridApi.getSelectedNodes();
    selectedNodes.map(node => node.rowIndex).forEach(index => {
      this.formArray.at(index).patchValue(this.bulkEditForm.value);
      this.formArray.at(index).updateValueAndValidity();
    })
    this.formArray.markAsDirty();
    this.bulkEditModalRef.close();
  }

  editItem(add?, isEditable = true) {
    this.editBackup = this.formArray.value;
    this.isEditable = isEditable
    this.showModalBackdrop = true;

    this.editModalRef = this.ngbModal.open(this.editModal, { centered: true, backdrop: false, keyboard: false, windowClass: 'large-modal' })
    this.editModalRef.result.then((resp) => {
      if (resp === 'proceed') {
        this.refreshRowData();
        this.forceResizeColumns();
        this.addAllowed = true;
        this.editBackup = null;
        this.addedIndex = null;
      }
      else {
        if (add) {
          this.formArray.removeAt(this.selectedRowIndex)
          this.rowData = this.formArray.value
        }
      }
      // this.showModalBackdrop = false;

    })
  }

  cancelEdit() {

    this.addAllowed = true;
    if (!this.isEditable) {
      this.showModalBackdrop = false;
    }
    this.editModalRef.close();
    // this.showModalBackdrop = false;
  }
  cancelNew() {

    this.isEditable = false
    this.newModalRef.close();
    this.prepareTable();
    this.showModalBackdrop = false;
  }

  goToPreviousItem() {
    const index = this.selectedRowIndex - 1;
    this.tempRowIndex = index;
    this.selectedRowIndex = null;
    setTimeout(() => {
      this.selectedRowIndex = index;
    });
  }

  goToNextItem() {
    const index = this.selectedRowIndex + 1;
    this.tempRowIndex = index;
    this.selectedRowIndex = null;
    setTimeout(() => {
      this.selectedRowIndex = index;
    });
  }

  clearFilters() {
    this.gridApi.setFilterModel(null);
  }

  private getFormObject() {
    this.makeAttributesReadOnly(this.definition)
    return this.fb.group(this.formService.createForm(this.definition.definition));
  }


  makeAttributesReadOnly(definition) {
    if (definition.properties && definition.properties.readonly) {
      definition.definition.forEach(element => {
        element.properties.readonly = true;
        if (element.type === 'Object' && !element.properties.schemaFree) {
          this.makeAttributesReadOnly(element);
        }
      });
    }
  }
  private prepareTable() {
    this.frameworkComponents = {
      customHeaderRenderer: ColOfObjsHeaderCellComponent,
      customCheckboxCellRenderer: GridCheckboxComponent,
      customCellRenderer: ColOfObjsGridCellComponent,
      actionColCellRenderer: EditColOfObjsComponent,
      customColumnFilterComponent: ColumnFilterComponent,
      customFloatingFilterComponent: FloatingFilterComponent,
      textEditor: TextEditor
    };
    this.ogRowData = _.cloneDeep(this.rowData)
    const columnDefs: Array<ColDef> = [
      // {
      //   headerName: '#',
      //   pinned: 'left',
      //   sortable: false,
      //   cellRenderer: 'customCheckboxCellRenderer',
      //   minWidth: 60,
      //   maxWidth: 60,
      // },
      ...(
        [{
          headerName: '',
          pinned: 'left',
          sortable: false,
          // cellRenderer: 'customCheckboxCellRenderer',
          minWidth: 60,
          maxWidth: 60,
          headerCheckboxSelection: true,
          checkboxSelection: true,
          filter: false,
        },]

      ),
      ...(
        this.showIndexColumn
          ? [{
            headerName: '#',
            valueGetter: "node.rowIndex + 1",
            // field: '__index',
            pinned: 'left',
            sortable: true,
          }]
          : []
      ),
      ...this.definitionList.map(definition => ({
        ...(definition.properties.required ? { headerComponent: 'customHeaderRenderer' } : {}),
        headerName: !!definition.properties.label ? definition.properties.label : definition.properties.name,
        field: definition.controlPath,
        sortable: true,
        headerClass: 'hide-filter-icon',
        resizable: true,
        cellRenderer: 'customCellRenderer',
        refData: definition,
        minWidth: definition.type === 'Date' ? 162 : 80,
        width: definition.type === 'Date' ? 162 : 80,
        floatingFiltersHeight: 40,
        // editable: () => {
        //   if (definition.properties.readonly) {
        //     return false
        //   }
        //   if (this.isEditable && (definition.type === 'String' || definition.type === 'Number') && !(definition.properties.richText || definition.properties.longText || definition.properties.password)) {
        //     return true
        //   }
        //   else {
        //     return false
        //   }
        // },
        // cellEditorSelector: () => {
        //   if (definition.properties.readonly) {
        //     return {}
        //   }
        //   if (this.isEditable && (definition.type === 'String' || definition.type === 'Number') && !(definition.properties.richText || definition.properties.longText || definition.properties.password)) {
        //     return { component: 'textEditor' }
        //   }
        //   else {
        //     return {}
        //   }
        // },

        // cellEditorParams: {
        //   type: definition.type,
        //   formArray: this.formArray,
        //   path: definition.controlPath
        // },
        onCellClicked: (params) => {
          this.selectedRowIndex = params.rowIndex;
          if (params.value?.filename) {
            return
          }
          if (this.isEditable) {
            return this.editItem()
          }
          this.openModal()
          return ''
          // if ((definition.properties.richText || definition.properties.longText || definition.properties.password)) {
          //   return this.editItem(null, this.isEditable)

          // }

          // else {

          //   return

          // }
        },
        onCellDoubleClicked: (params) => {
          this.selectedRowIndex = params.rowIndex;
          if (params.value?.filename) {
            return
          }
          if (this.isEditable) {
            return this.editItem()
          }
          this.openModal()
          return ''
          // if (this.isEditable && (definition.type === 'String' || definition.type === 'Number') && !(definition.properties.richText || definition.properties.longText || definition.properties.password)) {
          //   return ''
          // }

          // else {
          //   if (this.isEditable) {
          //     return this.editItem()
          //   }
          //   return ''
          // }
        },
        ...this.getFilterConfiguration(definition),
      })),
    ]

    if (!this.isEditable) {
      columnDefs.push({
        headerName: '',
        cellRenderer: 'actionColCellRenderer',
        pinned: 'right',
        minWidth: 40,
        maxWidth: 40,
      })
    }
    this.gridOptions = {
      context: {
        gridParent: this
      },
      columnDefs,
      pagination: !this.isEditable,
      // paginationPageSize: AG_GRID_PAGINATION_COUNT,
      animateRows: true,
      floatingFilter: true,
      onGridReady: this.onGridReady.bind(this),
      onRowDataChanged: this.autoSizeAllColumns.bind(this),
      // onGridSizeChanged: this.forceResizeColumns.bind(this),
      onSelectionChanged: this.onSelectionChanged.bind(this),
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      suppressRowDeselection: true,
      defaultColDef: {
        suppressMovable: true,
        suppressMenu: true
      },
      suppressColumnVirtualisation: true,
      rowHeight: 46,
      // onCellValueChanged: (params) => {
      //   const value = _.cloneDeep(params.data)
      //   if (value['__index']) {
      //     delete value['__index'];
      //   }
      //   this.formArray.at(params.rowIndex).setValue(value)
      // },
      headerHeight: 46,
      suppressPaginationPanel: true,
      suppressHorizontalScroll: false,
      // onRowDoubleClicked: this.onRowDoubleClick.bind(this)
    };

  }

  private onGridReady(event) {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    if (this.gridApi) {
      this.forceResizeColumns()
    }
  }

  private forceResizeColumns() {
    // this.gridApi.sizeColumnsToFit();
    this.autoSizeAllColumns();
  }

  private getFilterConfiguration(definition: any): Partial<ColDef> {
    const defaultFilterConf: Partial<ColDef> = {
      filterParams: {
        suppressAndOrCondition: true,
        suppressFilterButton: true,
      }
    }
    if (definition.type === 'Number') {
      return {
        filter: 'agNumberColumnFilter',
        floatingFilterComponent: 'customFloatingFilterComponent',
        ...defaultFilterConf
      }
    } else if (definition.type === 'String'
      && !definition.properties.longText
      && !definition.properties.richText
      && !definition.properties.password
      && !definition.properties.email
    ) {
      return {
        filter: 'agTextColumnFilter',
        floatingFilterComponent: 'customFloatingFilterComponent',
        ...defaultFilterConf
      };
    }
    return {
      filter: 'customColumnFilterComponent',
      floatingFilterComponent: 'customFloatingFilterComponent',
    }
  }

  private autoSizeAllColumns() {
    if (!!this.gridApi && !!this.columnApi) {
      setTimeout(() => {
        const container = document.querySelector('.grid-container');
        const availableWidth = !!container ? container.clientWidth - 80 : 900;
        const allColumns = this.columnApi.getAllColumns();
        allColumns.forEach(col => {
          this.columnApi.autoSizeColumn(col);
          if (col.getActualWidth() > AG_GRID_DEFAULT_COLUMN_WIDTH || this.gridApi.getDisplayedRowCount() === 0) {
            col.setActualWidth(AG_GRID_DEFAULT_COLUMN_WIDTH);
          }
        });
        const occupiedWidth = allColumns.reduce((pv, cv) => (pv + cv.getActualWidth()), -80);
        if (occupiedWidth < availableWidth) {
          this.gridApi.sizeColumnsToFit();
        }
      });
    }
  }

  private onGridSizeChanged() {
    if (!!this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }

  private refreshRowData() {
    this.rowData = this.formArray.value
    // this.prepareTable();
    // if (!this.addRow) {
    //   this.rowData = this.formArray.value
    // }
    // else {
    //   this.formArray.patchValue(this.rowData)
    // }
    if (this.gridApi) {
      this.gridApi.refreshCells()
    }
    // }
    // else {
    //   this.gridOptions?.api?.setRowData(this.formArray?.getRawValue().map((v, i) => ({ ...v, __index: i + 1 })));
    // }
    this.onSelectionChanged();
  }

  private onRowDoubleClick(params: any) {
    this.selectedRowIndex = params.rowIndex;
    this.editItem();
  }


  openModal() {
    this.isEditable = true;
    this.modalOptions = { ...this.gridOptions, pagination: false }
    this.prepareTable()
    this.addnew();
  }

  addnew() {
    // this.editBackup = this.formArray.getRawValue();
    this.showModalBackdrop = true;
    this.newModalRef = this.ngbModal.open(this.newModal, { centered: true, backdrop: false, keyboard: false, windowClass: 'large-modal' })
    this.newModalRef.result.then((resp) => {
      if (resp === 'save') {
        this.isEditable = false
        this.prepareTable();
        this.refreshRowData();
        this.forceResizeColumns();
      }
      else {
        this.rowData = this.ogRowData
        this.formArray.patchValue(this.rowData)

      }

      this.showModalBackdrop = false;
    })
  }

  openNew() {
    this.definitionList.forEach(definition => {
      if ((definition.type === 'String' || definition.type === 'Number') && !(definition.properties.richText || definition.properties.longText || definition.properties.password)) {
        this.addRow = true;
      }
      else {
        this.addRow = false
      }
    })
  }


  handleSecure() {
    const secureKeys = this.definitionList.filter(ele => ele.properties.password).map(ele => ele.key);
    if (secureKeys.length > 0) {
      this.formArray.controls.forEach(ele => {
        secureKeys.forEach(key => {
          const value = ele.get(key).value;
          if (value?.value) {
            this.decryptValue(value.value, ele, key);
          }
        })
      })
    }

  }

  decryptValue(value, ele, key) {
    let final = value;
    this.commonService.post('api', this.appService.serviceAPI + '/utils/sec/decrypt', { data: value }).subscribe(res => {
      if (res.data) {
        final = res.data;
        this.decryptValue(final, ele, key)
      }
    }, err => {
      if (_.isEmpty(err.error)) {
        final = value;
        const val = ele.get(key).value;
        console.log(val)
        if (val.value) {
          val['value'] = final;
        }
        ele.get(key).setValue(val);
        ele.value['key'] = val
      }
    })

  }


}
