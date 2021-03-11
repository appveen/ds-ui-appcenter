import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { InteractionsService } from 'src/app/dashboard/interactions/interactions.service';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/service/common.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'odp-interaction-log-block',
  templateUrl: './interaction-log-block.component.html',
  styleUrls: ['./interaction-log-block.component.scss']
})
export class InteractionLogBlockComponent implements OnInit, AfterViewInit, OnDestroy {

  // chart: am4charts.XYChart;
  monthYearFilter: Array<any>;
  mnths: Array<string>;
  columnDefs: Array<any>;
  showDatedd: boolean;
  selectedMonth: Date;
  private currentMonthVar: any;
  selectAllChecked: boolean;
  @ViewChild('redownloadModal', { static: false }) redownloadModal: ElementRef<any>;
  redownloadModalRef: NgbModalRef;
  subscriptions: any = {};

  constructor(public is: InteractionsService,
    private commonService: CommonService,
    private route: ActivatedRoute,
    private appService: AppService,
    private router: Router,
    private zone: NgZone,
    private ts: ToastrService,
    private modalService: NgbModal) {
    const self = this;
    self.monthYearFilter = [];
    self.mnths = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    self.columnDefs = [
      {
        show: true,
        key: '_checkbox',
        dataKey: '_checkbox',
        type: 'Checkbox',
        width: 48,
        definition: [],
        properties: {
          name: '#'
        },
        checkbox: true
      },
      {
        show: true,
        key: 'flowData',
        dataKey: 'flowData',
        type: 'Type',
        width: 100,
        properties: {
          name: 'Type'
        }
      },
      {
        show: true,
        properties: {
          name: 'Order ID'
        },
        type: 'dataStackTxnId',
        key: 'dataStackTxnId',
        dataKey: 'dataStackTxnId',
      },
      {
        show: true,
        properties: {
          name: 'Time',
        },
        key: 'createTimestamp',
        dataKey: 'createTimestamp',
        type: 'Time'
      },
      {
        show: true,
        properties: {
          name: 'Status',
        },
        type: 'Status',
        key: 'status',
        dataKey: 'status',
      }
    ];
    self.showDatedd = false;
    self.selectedMonth = null;
    self.selectAllChecked = false;
  }

  ngOnInit() {
    const self = this;
    self.fillFilter();
  }

  fillFilter() {
    const self = this;
    const now = new Date();
    for (const d = new Date(2018, 0, 1); d <= now; d.setMonth(d.getMonth() + 1)) {
      self.monthYearFilter.push(new Date(d));
    }
  }

  filterDate(index) {
    const self = this;
    const calculatedIndex = self.monthYearFilter[index].getMonth();
    return `${self.mnths[calculatedIndex]} ${self.monthYearFilter[index].getFullYear()}`;
  }

  getCount(flow, type: string) {
    const self = this;
    let count = 0;
    const last30Days = [];
    for (let i = 30; i >= 0; i--) {
      const obj = {
        date: new Date(new Date().setDate(new Date().getDate() - i))
      };
      last30Days.push(obj);
    }
    let tempArr = [];
    if (self.is.filteredLogs.length > 0) {
      tempArr = self.is.filteredLogs;
    } else {
      tempArr = self.is.records;
    }
    tempArr.forEach((rcrd) => {
      const date = new Date(rcrd.createTimestamp).toISOString().substring(0, 10);
      const dateIndex = last30Days.findIndex(e => e.date.toISOString().substring(0, 10) === date);
      if (dateIndex !== -1 && type === 'total' && rcrd.flowData.flowName === flow) {
        count++;
      }
      if (dateIndex !== -1 && type === 'success' && rcrd.flowData.flowName === flow && rcrd.status === 'SUCCESS') {
        count++;
      }
      if (dateIndex !== -1 && type === 'error' && rcrd.flowData.flowName === flow && rcrd.status === 'ERROR') {
        count++;
      }
      if (dateIndex !== -1 && type === 'pending' && rcrd.flowData.flowName === flow && rcrd.status === 'pending') {
        count++;
      }
    });
    return count;
  }

  ngAfterViewInit() {
    const self = this;
    self.zone.runOutsideAngular(() => {
      if (self.is.clonedRecords.length > 0) {
        self.is.getFlowData(null, true, self.is.startDate);
      } else {
        self.is.getFlowData(null);
      }
    });
  }

  get currentMonth(): any {
    const self = this;
    const monthYear = self.monthYearFilter[self.monthYearFilter.length - 1];
    self.currentMonthVar = `${self.mnths[monthYear.getMonth()]}  ${monthYear.getFullYear()}`;
    if (self.selectedMonth !== null && self.selectedMonth.getTime() > 0) {
      return `${self.mnths[self.selectedMonth.getMonth()]}  ${self.selectedMonth.getFullYear()}`;
    } else {
      return self.currentMonthVar;
    }
  }

  filterInteractionData(di) {
    const self = this;
    const e = self.filterDate(di);
    const [mnth, yr] = [e.split(' ')[0], e.split(' ')[1]];
    self.selectedMonth = new Date(`${yr}-${self.mnths.findIndex(m => m === mnth) + 1}-01`);
    self.is.flowDetails.name = self.is.flow.name;
    self.is.flowDetails.ver = self.is.flow.ver;
    self.is.flowDetails.status = self.is.flow.status;
    self.is.flowDetails.desc = self.is.flow.description;
    self.is.filterInteractionData(self.filterDate(di), self.is.flow, self.is.flowIndex);
    self.showDatedd = false;
  }

  allFlows() {
    const self = this;
    self.router.navigate(['/', this.commonService.app._id, `interactions/${self.appService.partnerId}`]);
  }

  viewInteraction(colData) {
    const self = this;
    self.appService.remoteTxnId = colData.remoteTxnId;
    self.router.navigate(['/', this.commonService.app._id, 'interactions',self.appService.partnerId,self.is.flow.id,colData.dataStackTxnId]);
  }

  selectAllRcrds() {
    const self = this;
    self.checkAll = !self.checkAll;
    self.selectAllChecked = self.checkAll;
  }

  get recordChecked() {
    const self = this;
    return self.is.filteredLogs.filter(e1 => e1._checked).length;
  }

  get checkAll() {
    const self = this;
    if (self.is.filteredLogs.length > 0) {
      return self.is.filteredLogs.every(e1 => e1._checked);
    }
    return false;
  }

  set checkAll(val) {
    const self = this;
    self.is.filteredLogs.forEach(e1 => {
      e1._checked = val;
    });
  }

  redownloadAll() {
    const self = this;
    const reqBodyArr = [];
    const failedRecords = self.is.filteredLogs.filter(e => e.status === 'ERROR' && e.redownloadMeta && e._checked);
    failedRecords.forEach((e) => {
      const obj = {
        remoteTxnID: e.remoteTxnId,
        dataStackTxnId: e.dataStackTxnId
      };
      reqBodyArr.push(obj);
    });
    self.redownloadModalRef = self.modalService.open(self.redownloadModal, { centered: true });
    self.redownloadModalRef.result.then((close) => {
      if (close) {
        self.subscriptions.metaDownload = self.commonService.post('pm',
          `/${self.commonService.app._id}/interaction/redownloadFile`,
          reqBodyArr)
          .subscribe((res) => {
            self.ts.success(res.message);
          });
      }
    }, dismiss => { });
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }
}
