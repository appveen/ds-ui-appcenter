import { Component, OnInit, ElementRef, TemplateRef, ViewChild, ComponentRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilterParams, FilterChangedEvent, IFloatingFilter, IFilterComp, TextFilter } from 'ag-grid-community';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { DomService } from 'src/app/service/dom.service';
import { DateFilterPickerComponent } from '../date-filter-picker/date-filter-picker.component';
import { InteractionsService } from '../../interactions.service';

@Component({
  selector: 'odp-interaction-grid-filter',
  templateUrl: './interaction-grid-filter.component.html',
  styleUrls: ['./interaction-grid-filter.component.scss'],
  providers: [DatePipe]
})
export class InteractionGridFilterComponent implements OnInit, IFloatingFilter, AgFrameworkComponent<IFloatingFilterParams> {

  @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
  params: IFloatingFilterParams;
  field: string;
  data: any;
  filterModel: any;
  value: any;
  filterInstance: TextFilter;
  clearFilterModalRef: NgbModalRef;
  dateFilterType: string;
  componentRef: ComponentRef<DateFilterPickerComponent>;
  constructor(private element: ElementRef,
    private appService: AppService,
    private commonService: CommonService,
    private modalService: NgbModal,
    private flowService: InteractionsService,
    private domService: DomService,
    private datePipe: DatePipe) {
    const self = this;
    self.filterModel = {};
    self.value = '';
    self.element.nativeElement.classList.add('w-100');
    self.element.nativeElement.style.marginTop = '6px';
    self.dateFilterType = 'equals';
  }

  ngOnInit() {
    const self = this;
    self.appService.clearFilterEvent.subscribe(() => {
      self.value = '';
    });
  }

  agInit(params: IFloatingFilterParams) {
    const self = this;
    self.params = params;
    self.filterModel = params.currentParentModel();
    self.field = params.column.getColDef().field;
    self.params.parentFilterInstance(function (instance: IFilterComp) {
      self.filterInstance = (instance as TextFilter);
    });
  }

  onParentModelChanged(parentModel: any, filterChangedEvent?: FilterChangedEvent): void {
    const self = this;
    const filterModel = self.params.api.getFilterModel();
    if (!filterModel[this.field]) {
      self.value = '';
    } else {
      const temp = JSON.parse(filterModel[this.field].filter);
      if (self.field === 'createTimestamp' || self.field === 'completedTimestamp') {
        self.value = self.datePipe.transform(new Date(temp[self.field]['$gte']), 'yyyy-MM-dd');
      } else if (self.field === 'flowData.inputType') {
        self.value = temp['flowData.inputType'] + '-' + temp['flowData.outputType'];
      } else if (self.field === 'status') {
        self.value = temp[self.field];
      } else {
        self.value = temp[self.field].substr(1, temp[self.field].length - 2);
      }
    }
  }

  onChange(value) {
    const self = this;
    let temp = {};
    if (!value || !value.trim()) {
      temp = {};
      self.flowService.filterApplied = null;
      self.filterInstance.onFloatingFilterChanged('text', null);
    } else {
      if (self.field === 'createTimestamp' || self.field === 'completedTimestamp') {
        temp[self.field] = self.getDateTimeQuery(value);
      } else if (self.field === 'flowData.inputType') {
        temp['flowData.inputType'] = value.split('-')[0];
        temp['flowData.outputType'] = value.split('-')[1];
      } else if (self.field === 'status') {
        temp[self.field] = value;
      } else {
        temp[self.field] = '/' + value + '/';
      }
      if (self.flowService.filterApplied && self.flowService.filterApplied === 'advance') {
        self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
        self.clearFilterModalRef.result.then(close => {
          if (close) {
            self.flowService.filterApplied = 'inline';
            self.filterInstance.onFloatingFilterChanged('text', JSON.stringify(temp));
            self.flowService.applyingFilter.emit('inline');
          } else {
            self.value = '';
          }
        }, dismiss => {
          self.value = '';
        });
      } else {
        self.flowService.filterApplied = 'inline';
        self.filterInstance.onFloatingFilterChanged('text', JSON.stringify(temp));
      }
    }
  }

  getDateTimeQuery(value) {
    const obj = {};
    if (value) {
      const fromDate = new Date(value);
      fromDate.setHours(0);
      fromDate.setMinutes(0);
      fromDate.setSeconds(0);
      fromDate.setMilliseconds(0);
      const toDate = new Date(value);
      toDate.setHours(23);
      toDate.setMinutes(59);
      toDate.setSeconds(59);
      toDate.setMilliseconds(999);
      obj['$gte'] = fromDate.toISOString();
      obj['$lte'] = toDate.toISOString();
    }
    return obj;
  }

  onFilterClick(event: MouseEvent) {
    const self = this;
    const target: HTMLElement = (event.target as HTMLElement);
    target.scrollIntoView();
    const left = target.getBoundingClientRect().left;
    const top = target.getBoundingClientRect().top + 20;
    if (self.componentRef) {
      self.domService.destroyComponent(self.componentRef);
    } else {
      self.componentRef = self.domService.appendComponentToBody(DateFilterPickerComponent);
      self.componentRef.instance.ele.nativeElement.style = `left:${left}px;top:${top}px;`;
    }
  }

}
