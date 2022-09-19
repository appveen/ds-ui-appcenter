import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridColumn, AgGridAngular } from 'ag-grid-angular';
import { IDatasource, IGetRowsParams, Column } from 'ag-grid-community';
import { of, Subject } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, take, catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { AgGridFiltersComponent } from './ag-grid-filters/ag-grid-filters.component';
import { environment } from 'src/environments/environment';
import { AgGridCellComponent } from './ag-grid-cell/ag-grid-cell.component';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { RelationTooltipComponent } from './ag-grid-cell/relation-tooltip/relation-tooltip.component';
import { ListAgGridService } from './list-ag-grid.service';
import { FormGroup } from '@angular/forms';
import { AppService } from '../../../../service/app.service';
import * as _ from 'lodash'

@Component({
  selector: 'odp-list-ag-grid',
  templateUrl: './list-ag-grid.component.html',
  styleUrls: ['./list-ag-grid.component.scss']
})
export class ListAgGridComponent implements OnInit, OnDestroy {
  @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
  @ViewChild('agGrid', { static: false }) agGrid: AgGridAngular;
  @Input() schema: any;
  @Input() columns: Array<any>;
  @Input() applySavedView: EventEmitter<any>;
  @Input() selectAll: EventEmitter<any>;
  @Input() searchForm: FormGroup;
  @Output() removedSavedView: EventEmitter<any>;
  @Output() selectedRecords: EventEmitter<Array<any>>;
  @Output() viewRecord: EventEmitter<any>;
  @Output() recordsInfo: EventEmitter<any>;
  @Output() rightClick: EventEmitter<any>;
  @Output() scroll: EventEmitter<boolean>;
  columnDefs: AgGridColumn[];
  dataSource: IDatasource;
  widthChange: Subject<any>;
  colWidthPrefId: string;
  apiEndpoint: string;
  apiConfig: GetOptions;
  sortModel: any;
  totalRecordsCount: number;
  currentRecordsCountPromise: Promise<any>;
  currentRecordsCount: number;
  filterModel: any;
  clearFilterModalRef: NgbModalRef;
  noRowsTemplate;
  showLoading: boolean;
  private subscription: any;
  searchView: any;
  context: any = this;
  constructor(
    private elementRef: ElementRef,
    private commonService: CommonService,
    private gridService: ListAgGridService,
    private modalService: NgbModal,
    private location: Location,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appService: AppService
  ) {
    const self = this;
    self.columnDefs = [];
    self.selectAll = new EventEmitter();
    self.applySavedView = new EventEmitter();
    self.removedSavedView = new EventEmitter();
    self.selectedRecords = new EventEmitter();
    self.viewRecord = new EventEmitter();
    self.recordsInfo = new EventEmitter();
    self.rightClick = new EventEmitter();
    self.scroll = new EventEmitter();
    self.widthChange = new Subject();
    self.rightClick = new EventEmitter();
    self.scroll = new EventEmitter();
    self.apiConfig = {
      count: 30,
      page: 1,
      expand: true,
      decrypt: true
    };
    self.subscription = {};
    self.noRowsTemplate = '<span>No records to display</span>';
    self.searchView = null;
  }

  ngOnInit() {
    const self = this;
    self.apiEndpoint = '/' + self.schema.app + self.schema.api;
    self.createColumnDefs();
    self.gridService.initializeLastFilterSearchText(self.schema._id);
    self.getPrefrences();
    this.activatedRoute.queryParams.pipe(take(1)).subscribe(queryParams => {
      if (!!queryParams) {
        if (!!queryParams.filter) {
          this.apiConfig.filter = JSON.parse(queryParams.filter);
        }
        if (!!queryParams.sort) {
          this.apiConfig.sort = JSON.parse(queryParams.sort);
        }
        setTimeout(() => {
          if (!!queryParams.sort) {
            const sortModel = [];
            if (!self.schema.schemaFree) {
              const sortStr = JSON.parse(queryParams.sort);
              sortStr.split(',').forEach(item => {
                let colId = item;
                let sort = 'asc';
                if (item.includes('-')) {
                  colId = colId.substr(1, colId.length);
                  sort = 'desc';
                }
                sortModel.push({ colId, sort });
              });
              this.agGrid.api.setSortModel(sortModel);
              this.gridService.setSortModel(sortModel)
            }

          }
          if (!!queryParams.select) {
            const select = JSON.parse(queryParams.select);
            const allColumns = this.agGrid.columnApi.getAllColumns();
            if (!!select?.length) {
              this.agGrid.columnApi.setColumnsVisible(allColumns, false);
              this.agGrid.columnApi.setColumnVisible('_checkbox', true);
              select.forEach((selectItem, index) => {
                const column = allColumns.find(col => {
                  const colId = col.getColId();
                  return selectItem === colId || selectItem.indexOf(colId + '.') === 0;
                });
                if (!!column) {
                  this.agGrid.columnApi.setColumnVisible(column, true);
                  this.agGrid.columnApi.moveColumn(column, index);
                }
              });
            } else {
              if (!self.schema.schemaFree || (self.apiConfig && self.apiConfig.project['_id'] != 0)) {
                this.agGrid.columnApi.setColumnsVisible(allColumns, true);
              }
            }
          }


        }, 1000);
      }
      self.getRecordsCount(true);
    });
    self.widthChange.pipe(debounceTime(500)).subscribe(ev => {
      self.setPrefrences(ev);
    });

    self.selectAll.subscribe(flag => {
      self.agGrid.api.forEachNode((rowNode, index) => {
        rowNode.setSelected(flag);
        if (rowNode.data) {
          rowNode.data._checked = flag;
        } else {
          if (!environment.production) {
            console.log(rowNode);
          }
        }
      });
    });

    this.gridService.filterSubject.subscribe(data => {
      this.clearFilter(false);
      let final = {};
      const filter = self.apiConfig.filter;
      const temp = filter?.['$and'] || [];
      if (data) {
        if (temp && temp.length > 0) {
          if (temp.find(ele => Object.keys(ele)[0] === Object.keys(data)[0])) {
            temp.forEach(ele => {
              if (Object.keys(ele)[0] === Object.keys(data)[0]) {
                ele = data
              }
            })
          }
          else {
            temp.push(data);
            final['$and'] = temp
          }
        }
        else {
          temp.push(data)
          final['$and'] = temp
        }
      }
      this.filterModified(null, final)
    })
  }

  ngOnDestroy() {
    const self = this;
    if (self.clearFilterModalRef) {
      self.clearFilterModalRef.close();
    }
    Object.keys(self.subscription).forEach(key => {
      if (self.subscription[key]) {
        self.subscription[key].unsubscribe();
      }
    });
  }

  getFilterUrlParams(config) {
    let urlParams = '';
    if (!!config.filter && Object.keys(config.filter).length !== 0) {
      urlParams += 'filter=' + JSON.stringify(config.filter);
    }
    if (!!config.sort) {
      if (!this.schema.schemaFree || (this.schema.schemaFree && Object.keys(config.sort).length !== 0)) {
        urlParams += (!!urlParams ? '&sort=' : 'sort=') + JSON.stringify(config.sort);
      }
    }
    if (!!config.project && Object.keys(config.project).length !== 0) {
      urlParams += (!!urlParams ? '&select=' : 'select=') + JSON.stringify(config.project);
    }
    if (!!config.count) {
      urlParams += (!!urlParams ? '&count=' : 'count=') + config.count;
    }
    if (!!config.page) {
      urlParams += (!!urlParams ? '&page=' : 'page=') + config.page;
    }
    if (!!config.select) {
      const compColumnIds = this.gridService.getSelect(this.columns.filter(c => c.key !== '_checkbox'));
      const compSelect = config.select;
      let isSame = true;
      compColumnIds.forEach((item, index) => {
        isSame = isSame && item === compSelect[index];
      });
      if (!isSame) {
        urlParams += (!!urlParams ? '&select=' : 'select=') + JSON.stringify(compSelect);
      }
    }
    return urlParams;
  }

  initRows(emptyFilter?: boolean) {
    const self = this;
    if (!emptyFilter) {
      self.getRecordsCount();
    }
    // if ((!self.searchView) || (self.searchView && !self.searchView.count && !self.searchView.page)) {
    self.apiConfig.page = 1;
    //}
  }

  getRecordsCount(first?: boolean) {
    const self = this;
    if (this.searchForm) {
      this.apiConfig['filter'] = JSON.parse(this.searchForm.get('filter').value)
      this.apiConfig['project'] = JSON.parse(this.searchForm.get('project').value)
      this.apiConfig['sort'] = JSON.parse(this.searchForm.get('sort').value)
    }
    const filter = self.apiConfig.filter;

    self.currentRecordsCountPromise = self.commonService
      .get('api', self.apiEndpoint + '/utils/count', { filter, expand: true })
      .pipe(
        catchError(err => of(err)),
        map(count => {
          if (typeof count == 'object') {
            self.commonService.errorToast(count);
            self.currentRecordsCount = 0;
            self.recordsInfo.emit({
              loaded: 0,
              total: 0
            });
            return 0;
          }
          else {
            // if (self.schema.schemaFree && self.searchView && (self.searchView.count || self.searchView.page)) {
            //   let min_records = (self.apiConfig.count) * (self.apiConfig.page - 1);
            //   let max_records = self.apiConfig.count + min_records;
            //   if (count < min_records) {
            //     count = 0;
            //   }
            //   else if (count >= max_records) {
            //     count = self.apiConfig.count;
            //   }
            //   else if (count >= min_records && count < max_records) {
            //     count = count - min_records;
            //   }
            // }

            if (first) {
              self.totalRecordsCount = count;
            }
            self.currentRecordsCount = count;
            self.recordsInfo.emit({
              loaded: 0,
              total: count
            });

            return count;
          }
        }),
      )
      .toPromise();
  }

  getRecords() {
    const self = this;
    if (self.apiConfig.sort === null) {
      delete self.apiConfig.sort
    }
    return self.commonService.get('api', self.apiEndpoint, self.apiConfig);
  }

  getPrefrences() {
    const self = this;
    const options: GetOptions = {
      filter: {
        userId: self.commonService.userDetails._id,
        type: { $in: ['column-width'] },
        key: self.schema._id
      }
    };
    self.commonService.get('user', '/data/preferences', options).subscribe(
      prefRes => {
        try {
          const colWidth = prefRes.filter(e => e.type === 'column-width');
          if (colWidth && colWidth.length > 0) {
            if (colWidth[0] && colWidth[0]._id) {
              self.colWidthPrefId = colWidth[0]._id;
            }
            const widthValues = JSON.parse(colWidth[0].value);
            if (widthValues && widthValues.length > 0) {
              widthValues.forEach(item => {
                self.agGrid.columnApi.setColumnWidth(item.colId, item.width);
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      },
      prefErr => {
        self.commonService.errorToast(prefErr, 'Unable to load preference');
      }
    );
  }

  setPrefrences(columns: Array<Column>) {
    const self = this;
    const colWidth = columns.map(col => {
      return {
        colId: col.getColId(),
        width: col.getActualWidth()
      };
    });
    let response;
    const payload = {
      userId: self.commonService.userDetails._id,
      type: 'column-width',
      key: self.schema._id,
      value: JSON.stringify(colWidth)
    };
    if (self.colWidthPrefId) {
      response = self.commonService.put('user', '/data/preferences/' + self.colWidthPrefId, payload);
    } else {
      response = self.commonService.post('user', '/data/preferences/', payload);
    }
    response.subscribe(
      widthPref => {
        if (widthPref._id) {
          self.colWidthPrefId = widthPref._id;
        }
      },
      err => {
        console.error(err.message, 'unable to save column width preference');
      }
    );
  }

  configureView(viewModel) {
    const self = this;
    try {
      let reload = false;
      const filters = [];
      const sort = [];
      const sortModel = [];
      const columnIds = self.agGrid.columnApi.getAllColumns().map(e => e.getColId());
      if (viewModel.select && viewModel.select.split(',').length > 0) {
        const fields = viewModel.select.split(',');
        self.agGrid.columnApi.setColumnsVisible(columnIds, false);
        self.agGrid.columnApi.setColumnsVisible(fields, true);
        self.agGrid.columnApi.setColumnVisible('_checkbox', true);
        fields.forEach((key, i) => {
          self.agGrid.columnApi.moveColumn(key, i + 1);
        });
      } else {
        self.agGrid.columnApi.setColumnsVisible(columnIds, true);
      }
      if (self.schema.schemaFree && viewModel.value.project) {
        let project = JSON.parse(viewModel.value.project)
        if (project && Object.keys(project).length > 0) {
          if (project['_id'] == 0) {
            self.agGrid.columnApi.setColumnVisible('_id', false);
          }
        }
      }
      if (!self.schema.schemaFree && viewModel.filter && viewModel.filter.length > 0) {
        viewModel.filter.forEach(item => {
          if (!!Object.keys(item.filterObject).length) {
            filters.push(item.filterObject);
          }
        });
      }
      else if (self.schema.schemaFree && viewModel.value.filter) {
        filters.push(JSON.parse(viewModel.value.filter));
      }
      if (!self.schema.schemaFree && viewModel.sort && viewModel.sort.length > 0) {
        viewModel.sort.forEach(item => {
          if (typeof item.selectedOption === 'string') {
            item.selectedOption = parseInt(item.selectedOption, 10);
          }
          sortModel.push({
            colId: item.name,
            sort: item.selectedOption === 1 ? 'asc' : 'desc'
          });
          sort.push((item.selectedOption === 1 ? '' : '-') + item.name);
        });
      }
      if (filters.length > 0) {
        if (self.schema.schemaFree) {
          self.apiConfig.filter = filters[0];
        } else {
          self.apiConfig.filter = { $and: filters };
        }
        reload = true;
        if (!environment.production) {
          console.log('Setting Filter Model');
        }
        self.agGrid.api.setFilterModel({
          _id: {
            filterType: 'text',
            type: '',
            filter: ''
          }
        });
      } else {
        self.apiConfig.filter = null;
        self.agGrid.api.setFilterModel(null);
      }
      if (sort.length > 0 && !self.schema.schemaFree) {
        self.apiConfig.sort = sort.join(',');
        this.gridService.setSortModel(self.apiConfig.sort)
        if (!environment.production) {
          console.log('Setting Sort Model');
        }
        reload = true;
        self.agGrid.api.setSortModel(sortModel);
        self.gridService.setSortModel(sortModel)
      }
      else if (self.schema.schemaFree && viewModel.value.sort) {
        self.apiConfig.sort = JSON.parse(viewModel.value.sort);
        this.gridService.setSortModel(self.apiConfig.sort)
        reload = true;
      }
      else {
        self.apiConfig.sort = null;
        this.gridService.setSortModel(self.apiConfig.sort)
        self.agGrid.api.setSortModel(null);
        self.gridService.setSortModel(sortModel)
      }
      if (self.schema.schemaFree && viewModel.value.project) {
        self.apiConfig.project = JSON.parse(viewModel.value.project);
        reload = true;
      }
      // if (self.schema.schemaFree && viewModel.value.count) {
      //   self.apiConfig.count = viewModel.value.count;
      //   reload = true;
      // } else if (self.schema.schemaFree && !viewModel.value.count) {
      //   self.apiConfig.count = 30;
      //   reload = true;
      // }
      // if (self.schema.schemaFree && viewModel.value.page) {
      //   self.apiConfig.page = viewModel.value.page;
      //   reload = true;
      // } else if (self.schema.schemaFree && !viewModel.value.page) {
      //   self.apiConfig.page = 1;
      //   reload = true;
      // }

      if (reload) {
        self.initRows();
      }
    } catch (e) {
      console.error(e);
    }
  }

  createColumnDefs() {
    if (!this.columns.find(ele => ele.key === '_checkbox')) {
      this.columns.unshift({
        show: true,
        key: '_checkbox',
        dataKey: '_checkbox',
        type: 'Checkbox',
        width: 20,
        definition: [],
        properties: {
          name: ''
        },
        checkbox: true
      })
    }

    this.columns.forEach((e, i) => {
      const temp: any = {};
      if (e.properties) {
        if (e.properties.label) {
          (temp as AgGridColumn).headerName = e.properties.label;
        } else {
          (temp as AgGridColumn).headerName = e.properties.name;
        }
      }
      (temp as AgGridColumn).field = e.dataKey;
      if (e.type === 'Checkbox') {
        (temp as AgGridColumn).width = 40;
        (temp as AgGridColumn).pinned = 'left';
        (temp as AgGridColumn).headerCheckboxSelection = true;
        (temp as AgGridColumn).checkboxSelection = true;

      } else {
        (temp as AgGridColumn).sortable = true;
        if (!this.schema.schemaFree) {
          (temp as AgGridColumn).filter = 'agTextColumnFilter';
          (temp as AgGridColumn).floatingFilterComponentFramework = AgGridFiltersComponent;
          (temp as AgGridColumn).filterParams = {
            caseSensitive: true,
            suppressAndOrCondition: true,
            suppressFilterButton: true
          };
        }
        else {
          (temp as AgGridColumn).width = 250;
        }
        (temp as AgGridColumn).suppressMenu = true;
        (temp as AgGridColumn).headerClass = 'hide-filter-icon';
        (temp as AgGridColumn).resizable = true;

      }
      if (e.type === 'Relation') {
        (temp as AgGridColumn).tooltipField = e.dataKey;
        (temp as AgGridColumn).tooltipComponentFramework = RelationTooltipComponent;
      }
      (temp as AgGridColumn).cellRendererFramework = AgGridCellComponent;
      (temp as AgGridColumn).refData = e;
      (temp as AgGridColumn).hide = !e.show;
      this.columnDefs.push(temp);
    });
  }


  rowDoubleClicked(event) {
    const self = this;
    if (event) {
      self.viewRecord.emit(event.data);
    }
    this.showLoading = false
  }

  rowSelected(event) {
    const self = this;
    const selectedNodes = self.agGrid.api.getSelectedNodes();
    if (selectedNodes) {
      const selectedData = selectedNodes.map(node => node.data);
      self.selectedRecords.emit(selectedData);
    }
  }

  sortChanged(event) {
    const self = this;
    const sortModel = self.agGrid.api.getSortModel();
    let sort = '';
    if (sortModel) {
      sort = sortModel.map(e => (e.sort === 'asc' ? '' : '-') + e.colId).join(',');
    }
    self.apiConfig.sort = sort;
    self.sortModel = sort;
    this.gridService.setSortModel(sort)
    if (!environment.production) {
      console.log('Sort Modified', sortModel);
    }
  }

  clearSort() {
    const self = this;
    self.sortModel = null;
    self.apiConfig.sort = null;
    this.gridService.setSortModel(self.apiConfig.sort)
    self.agGrid.api.setSortModel(null);
    self.gridService.setSortModel(null)
    // self.initRows(true);
  }

  filterModified(event, modFilter?) {
    const self = this;
    const filter = [];
    const filterModel = self.agGrid && self.agGrid.api && self.agGrid.api.getFilterModel();
    if (filterModel) {
      Object.keys(filterModel).forEach(key => {
        try {
          if (filterModel[key].filter) {
            filter.push(JSON.parse(filterModel[key].filter));
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
    if (filter.length > 0) {
      self.apiConfig.filter = { $and: filter };
      self.gridService.inlineFilterActive = true;
    } else {
      self.gridService.inlineFilterActive = false;
      self.apiConfig.filter = modFilter;
    }
    if (!environment.production) {
      console.log('Filter Modified', filterModel);
    }
    // self.removedSavedView.emit(true);
    self.filterModel = self.apiConfig.filter || modFilter;

    this.initRows()
  }

  clearFilter(clearGridModel = true) {
    const self = this;
    self.apiConfig.filter = null;
    self.filterModel = null;
    if (clearGridModel) {
      self.agGrid.api.setFilterModel(null);
    }
    self.initRows();
  }

  clearSavedView() {
    const self = this;
    self.filterModel = null;
    self.sortModel = null;
    self.gridService.inlineFilterActive = null;
    self.gridService.selectedSavedView = null;
    self.apiConfig.filter = null;
    self.apiConfig.sort = null;
    this.gridService.setSortModel(self.apiConfig.sort)
    self.apiConfig.project = null;
    self.apiConfig.select = null;
    if (self.schema.schemaFree) {
      self.apiConfig.count = 30;
      self.apiConfig.page = 1;
    }
    self.searchView = null;
    self.agGrid.api.setFilterModel(null);
    self.agGrid.api.setSortModel(null);
    self.gridService.setSortModel(null)
    const columnIds = self.agGrid.columnApi.getAllColumns().map(e => e.getColId());
    if (self.schema.schemaFree && columnIds[2] == '0') {
      columnIds[2] = 'Data';
    }
    self.agGrid.columnApi.setColumnsVisible(columnIds, true);
    self.columns.forEach((e, i) => {
      self.agGrid.columnApi.moveColumn(e.dataKey, i);
    });
    self.initRows();
  }

  columnResized(event) {
    const self = this;
    const columns = self.agGrid.columnApi.getAllColumns();
    self.widthChange.next(columns);
  }
  columnMoved() {
    const self = this;
    if (self.schema.schemaFree) {
      return;
    }
    let definitionList = self.agGrid.columnApi
      .getAllColumns()
      .filter(e => e.isVisible())
      .map(e => e.getColDef().refData);
    const cols = self.agGrid.columnApi.getAllGridColumns();
    const colToNameFunc = function (col, index) {
      return {
        index,
        colId: col.getId()
      };
    };
    const colNames = cols.map(colToNameFunc);
    const filteredColms = [];
    definitionList.forEach(element => {
      const obj = colNames.find(ele => ele.colId === element.dataKey);
      if (obj) {
        filteredColms.push(obj);
      }
    });
    const selectedColumns = [];
    filteredColms.sort((a, b) => a.index - b.index);
    filteredColms.forEach(ele => {
      const obj = definitionList.find(element => ele.colId === element.dataKey);
      if (obj) {
        selectedColumns.push(obj);
      }
    });
    definitionList = selectedColumns;
    self.apiConfig.select = self.gridService.getSelect(definitionList);
  }

  cellContextMenu($event) {
    const self = this;
    self.rightClick.emit($event);
  }

  scrollEvent() {
    const self = this;
    self.scroll.emit(true);
  }

  onGridReady(event) {
    const self = this;
    self.dataSource = {
      getRows: (params: IGetRowsParams) => {
        if (!environment.production) {
          console.log('getRows', params);
        }
        let definitionList = self.agGrid.columnApi
          .getAllColumns()
          .filter(e => e.isVisible())
          .map(e => e.getColDef().refData);
        const cols = self.agGrid.columnApi.getAllGridColumns();
        const colToNameFunc = function (col, index) {
          return {
            index,
            colId: col.getId()
          };
        };
        const colNames = cols.map(colToNameFunc);
        const filteredColms = [];
        definitionList.forEach(element => {
          const obj = colNames.find(ele => ele.colId === element.dataKey);
          if (obj) {
            filteredColms.push(obj);
          }
        });
        const sc = [];
        filteredColms.sort((a, b) => a.index - b.index);
        filteredColms.forEach(ele => {
          const obj = definitionList.find(element => ele.colId === element.dataKey);
          if (obj) {
            sc.push(obj);
          }
        });
        definitionList = sc;
        if (!self.schema.schemaFree) {
          self.apiConfig.select = self.gridService.getSelect(definitionList);
        }
        self.agGrid.api.showLoadingOverlay();
        self.showLoading = true;
        self.selectedRecords.emit([]);
        self.currentRecordsCountPromise.then(count => {
          if (params.endRow - 30 < self.currentRecordsCount) {
            // if ((!self.searchView) || (self.searchView && !self.searchView.count && !self.searchView.page)) {
            self.apiConfig.page = Math.ceil(params.endRow / 30);
            //}
            if (self.subscription['getRecords_' + self.apiConfig.page]) {
              self.subscription['getRecords_' + self.apiConfig.page].unsubscribe();
            }
            self.subscription['getRecords_' + self.apiConfig.page] = self.getRecords().subscribe(
              (records: any) => {
                let loaded = params.endRow;
                if (loaded > self.currentRecordsCount) {
                  loaded = self.currentRecordsCount;
                }
                if (self.schema.schemaFree) {
                  let data = JSON.parse(JSON.stringify(records))
                  data.forEach((element, index) => {
                    delete element['_metadata'];
                    delete element['_workflow'];
                    delete element['__v'];
                    records[index].data = element;
                  });
                }
                self.agGrid.api.hideOverlay();
                self.showLoading = false;
                // self.agGrid.api.deselectAll();
                self.recordsInfo.emit({
                  loaded,
                  total: self.currentRecordsCount
                });
                if (loaded === self.currentRecordsCount) {
                  params.successCallback(records, self.currentRecordsCount);
                } else {
                  params.successCallback(records);
                }
                self.rowSelected(null);
              },
              err => {
                self.commonService.errorToast(err);
                self.showLoading = false;
                self.agGrid.api.hideOverlay();
                self.currentRecordsCount = 0;
                self.totalRecordsCount = 0;
                self.recordsInfo.emit({
                  loaded: 0,
                  total: 0
                });
                self.agGrid.api.showNoRowsOverlay();
              })
          } else {
            self.agGrid.api.hideOverlay();
            if (self.currentRecordsCount == 0) {
              self.agGrid.api.showNoRowsOverlay();
            }
            params.successCallback([], self.currentRecordsCount);
          }
          if (!!this.apiConfig.filter || !!this.apiConfig.sort || !!this.apiConfig.select) {
            this.location.go(this.router.url.split('?')[0], this.getFilterUrlParams(this.apiConfig));
          } else {
            this.location.go(this.router.url.split('?')[0]);
          }
        });
      }
    };
  }


  applyView(data) {
    const self = this
    try {
      if (data.value) {
        if (typeof data.value === 'string') {
          data.value = JSON.parse(data.value);
        }
        const viewModel = data.value;
        if (self.schema.schemaFree) {
          self.searchView = data.value.value;
        }
        const temp = self.agGrid.api.getFilterModel();
        if (temp && Object.keys(temp).length > 0) {
          self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
          self.clearFilterModalRef.result.then(
            close => {
              if (close) {
                self.gridService.selectedSavedView = viewModel;
                self.configureView(viewModel || {});
              }
            },
            dismiss => { }
          );
        } else {
          self.gridService.selectedSavedView = viewModel;
          self.configureView(viewModel || {});
        }
      }
    } catch (e) {
      console.error(e);
    }

  }
}
