import { Injectable, NgZone, EventEmitter } from '@angular/core';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { NodeData } from './interactions.model';

@Injectable({
  providedIn: 'root'
})

export class InteractionsService {
  grandTotal: number;
  tPass: number;
  tError: number;
  tPending: number;
  allFlows: Array<any>;
  records: Array<any>;
  noDataForChart: boolean;
  chart: am4charts.XYChart;
  clonedRecords: Array<any>;
  IntegrationName: string;
  toggleDropdown: boolean;
  mnths: Array<string>;
  selectedMonth: Date;
  showDatedd: boolean;
  filteredLogs: Array<any>;
  partnerName: string;
  flowIndex: number;
  flowDetails = {
    name: '',
    ver: '',
    status: '',
    desc: ''
  };
  flow: any;
  startDate: Date;
  byPassIndex: boolean;
  fromAllInteractions: boolean;

  filterApplied: string;
  applyingFilter: EventEmitter<any>;
  private withinInteractions: boolean;

  constructor(private zone: NgZone) {
    const self = this;
    self.grandTotal = 0;
    self.tPass = 0;
    self.tError = 0;
    self.tPending = 0;
    self.allFlows = [];
    self.records = [];
    self.clonedRecords = [];
    self.noDataForChart = false;
    self.IntegrationName = 'All Integrations';
    self.toggleDropdown = false;
    self.mnths = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    self.selectedMonth = null;
    self.filteredLogs = [];
    self.partnerName = '';
    self.flowIndex = -1;
    self.startDate = null;
    self.byPassIndex = false;
    self.applyingFilter = new EventEmitter();
  }

  toggleExpand(index, event?) {
    const self = this;
    self.grandTotal = 0;
    self.tPass = 0;
    self.tError = 0;
    self.tPending = 0;
    if (event) {
      self.allFlows[index].isExpanded = !self.allFlows[index].isExpanded;
      self.records[index].isExpanded = !self.records[index].isExpanded;
      if (self.records[index].isExpanded) {
        self.getFlowData(index);
        if (self.noDataForChart) {
          return { 'max-height': '180px', 'min-height': '180px' };
        }
        return { 'min-height': '500px' };
      } else {
        if (self.chart) {
          self.chart.dispose();
        }
        return { 'min-height': '120px' };
      }
    } else {
      if (self.records[index].isExpanded) {
        return { 'min-height': '340px' };
      } else {
        return { 'min-height': '120px' };
      }
    }
  }

  getFlowData(index, filter?, startDate?) {
    const self = this;
    let iterationArr = [];
    if (filter) {
      iterationArr = self.clonedRecords;
    } else {
      iterationArr = self.records;
    }
    if (iterationArr.length > 0) {
      const dateWiseFlow = [];
      if (startDate) {
        const monthDays = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
        for (let i = 0; i <= monthDays; i++) {
          const tempDate = new Date();
          tempDate.setDate(startDate.getDate() + i);
          tempDate.setMonth(startDate.getMonth());
          tempDate.setFullYear(startDate.getFullYear());
          const obj = {
            date: tempDate,
            flowCount: 0,
            pass: 0,
            failed: 0,
            pending: 0,
            total: 0
          };
          dateWiseFlow.push(obj);
        }
      } else {
        for (let i = 30; i >= 0; i--) {
          const obj = {
            date: new Date(new Date().setDate(new Date().getDate() - i)),
            flowCount: 0,
            pass: 0,
            failed: 0,
            pending: 0,
            total: 0
          };
          dateWiseFlow.push(obj);
        }
      }
      // const monthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      for (const item of dateWiseFlow) {
        item.flowCount = item.pass + item.failed + item.pending;
      }
      iterationArr.forEach((rcrd) => {
        const date = new Date(rcrd.createTimestamp).toISOString().substring(0, 10);
        const dateIndex = dateWiseFlow.findIndex(e => e.date.toISOString().substring(0, 10) === date);
        let tempIndex;
        if (index !== null) {
          tempIndex = index;
        } else {
          tempIndex = self.flowIndex;
        }
        if (dateIndex !== -1 && self.allFlows[tempIndex].name === rcrd.flowData.flowName) {
          dateWiseFlow[dateIndex].flowCount++;
          if (rcrd.status === 'SUCCESS') {
            dateWiseFlow[dateIndex].pass++;
          } else if (rcrd.status === 'ERROR') {
            dateWiseFlow[dateIndex].failed++;
          } else if (rcrd.status === 'PENDING') {
            dateWiseFlow[dateIndex].pending++;
          }
          dateWiseFlow[dateIndex].total = dateWiseFlow[dateIndex].pass + dateWiseFlow[dateIndex].failed + dateWiseFlow[dateIndex].pending;
        }
      });
      dateWiseFlow.forEach(e => {
        self.grandTotal = self.grandTotal + e.total;
        self.tPass = self.tPass + e.pass;
        self.tError = self.tError + e.failed;
        self.tPending = self.tPending + e.pending;
      });

      if (dateWiseFlow.length > 0 && self.grandTotal > 0) {
        self.zone.runOutsideAngular(() => {
          let chart;
          if (index !== null && !self.byPassIndex) {
            chart = am4core.create('chartDiv-' + index, am4charts.XYChart);
          } else {
            chart = am4core.create('chartDiv', am4charts.XYChart);
          }
          chart.data = dateWiseFlow;
          chart.paddingRight = 30;
          chart.paddingLeft = 30;

          // Create date axis
          const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
          dateAxis.renderer.grid.template.disabled = true;
          dateAxis.renderer.minGridDistance = 40;
          dateAxis.dateFormats.setKey('day', 'MMM-d');
          dateAxis.cursorTooltipEnabled = false;

          // Create value axis
          const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
          valueAxis.renderer.grid.template.disabled = true;
          valueAxis.renderer.labels.template.disabled = true;
          valueAxis.cursorTooltipEnabled = false;

          // Create series
          const series1 = chart.series.push(new am4charts.ColumnSeries());
          series1.dataFields.valueY = 'pass';
          series1.dataFields.dateX = 'date';
          series1.name = 'Success';
          series1.columns.template.width = am4core.percent(99);
          series1.columns.template.fill = am4core.color('#ececec');
          series1.columns.template.stroke = am4core.color('#ececec');
          series1.stacked = true;
          const hoverState1 = series1.columns.template.states.create('hover');
          hoverState1.properties.fill = am4core.color('#b2f43f');
          hoverState1.properties.stroke = am4core.color('#b2f43f');
          hoverState1.properties.fillOpacity = 0.8;

          const series2 = chart.series.push(new am4charts.ColumnSeries());
          series2.dataFields.valueY = 'failed';
          series2.dataFields.dateX = 'date';
          series2.name = 'Failed';
          series2.columns.template.width = am4core.percent(99);
          series2.columns.template.fill = am4core.color('#ececec');
          series2.columns.template.stroke = am4core.color('#ececec');
          series2.stacked = true;
          const hoverState2 = series2.columns.template.states.create('hover');
          hoverState2.properties.fill = am4core.color('#f71c1c');
          hoverState2.properties.stroke = am4core.color('#f71c1c');
          hoverState2.properties.fillOpacity = 0.8;

          const series3 = chart.series.push(new am4charts.ColumnSeries());
          series3.dataFields.valueY = 'pending';
          series3.dataFields.dateX = 'date';
          series3.name = 'Progress';
          series3.columns.template.width = am4core.percent(99);
          series3.columns.template.fill = am4core.color('#ececec');
          series3.columns.template.stroke = am4core.color('#ececec');
          series3.stacked = true;
          const hoverState3 = series3.columns.template.states.create('hover');
          hoverState3.properties.fill = am4core.color('#fee140');
          hoverState3.properties.stroke = am4core.color('#fee140');
          hoverState3.properties.fillOpacity = 0.8;

          const series4 = chart.series.push(new am4charts.ColumnSeries());
          series4.dataFields.valueY = 'void';
          series4.dataFields.dateX = 'date';
          series4.name = 'All';
          series4.columns.template.width = am4core.percent(99);
          series4.columns.template.fill = am4core.color('#fff');
          series4.columns.template.stroke = am4core.color('#fff');
          series4.stacked = true;
          /*const hoverState4 = series4.columns.template.states.create('hover');
          hoverState4.properties.fill = am4core.color('#fff');
          hoverState4.properties.stroke = am4core.color('#fff');*/

          // tooltip
          series1.tooltip.getFillFromObject = false;
          series1.tooltip.background.fill = am4core.color('#fff');
          series1.tooltip.label.fill = am4core.color('#000');
          series1.tooltip.label.padding(0, 0, 0, 0);
          series1.tooltip.background.cornerRadius = 8;

          series2.tooltip.getFillFromObject = false;
          series2.tooltip.background.fill = am4core.color('#fff');
          series2.tooltip.label.fill = am4core.color('#000');
          series2.tooltip.label.padding(0, 0, 0, 0);
          series2.tooltip.background.cornerRadius = 8;

          series3.tooltip.getFillFromObject = false;
          series3.tooltip.background.fill = am4core.color('#fff');
          series3.tooltip.label.fill = am4core.color('#000');
          series3.tooltip.label.padding(0, 0, 0, 0);
          series3.tooltip.background.cornerRadius = 8;

          // Legend

          const legend = new am4charts.Legend();
          legend.parent = chart.chartAndLegendContainer;

          legend.data = [{
            name: 'Success',
            fill: '#b2f43f'
          }, {
            name: 'Failed',
            fill: '#f71c1c'
          }, {
            name: 'Progress',
            fill: '#fee140'
          }, {
            name: 'All',
            fill: '#0093E9'
          }];

          legend.itemContainers.template.clickable = true;

          legend.itemContainers.template.togglable = false;

          legend.itemContainers.template.events.on('hit', (ev) => {
            if (ev.target.dataItem.dataContext['name'] === 'Success') {
              series2.hide();
              series3.hide();
              series4.hide();
              if (series1.isHidden) {
                series1.show();
              }
            }
            if (ev.target.dataItem.dataContext['name'] === 'Failed') {
              series1.hide();
              series3.hide();
              series4.hide();
              if (series2.isHidden) {
                series2.show();
              }
            }
            if (ev.target.dataItem.dataContext['name'] === 'Progress') {
              series1.hide();
              series2.hide();
              series4.hide();
              if (series3.isHidden) {
                series3.show();
              }
            }
            if (ev.target.dataItem.dataContext['name'] === 'All') {
              if (series1.isHidden) {
                series1.show();
              }
              if (series2.isHidden) {
                series2.show();
              }
              if (series3.isHidden) {
                series3.show();
              }
            }
          });

          chart.cursor = new am4charts.XYCursor();
          chart.cursor.lineX.disabled = true;
          chart.cursor.lineY.disabled = true;

          series1.columns.template.tooltipY = 0;
          series1.columns.template.tooltipHTML = `<div class="bg-dark text-white p-1 m-0 tooltip-header">
            {date.formatDate('dd/MMM/yy')} </div>
            <div class="px-2">
              <table class="m-0">
                <tr>
                  <td><span class="fas fa-xs fa-circle text-primary"></span></td>
                  <td>
                    <div class="ml-1">{flowCount}</div>
                  </td>
                </tr>
                <tr>
                  <td><span class="fas fa-xs fa-circle text-success"></span></td>
                  <td><div class="ml-1">{pass}</div></td>
                </tr>
                <tr>
                  <td><span class="fas fa-xs fa-circle text-danger"></span></td>
                  <td><div class="ml-1">{failed}</div></td>
                </tr>
                <tr>
                  <td><span class="fas fa-xs fa-circle text-warning"></span></td>
                  <td><div class="ml-1">{pending}</div></td>
                </tr>
              </table>
            </div>`;

          /*series2.columns.template.tooltipHTML = series1.columns.template.tooltipHTML;
          series3.columns.template.tooltipHTML = series1.columns.template.tooltipHTML;*/

          // chart.scrollbarX = new am4core.Scrollbar();

          self.chart = chart;
        });
      } else {
        self.noDataForChart = true;
      }
    } else {
      if (self.chart) {
        self.chart.dispose();
      }
      return;
    }
  }

  filterInteractionData(e, flow, i) {
    const self = this;
    const [mnth, yr] = [e.split(' ')[0], e.split(' ')[1]];
    const startDate = new Date(`${yr}-${self.mnths.findIndex(m => m === mnth) + 1}-01`);
    const monthDays = new Date(yr, self.mnths.findIndex(m => m === mnth) + 1, 0).getDate();
    const endDate = new Date(`${yr}-${self.mnths.findIndex(m => m === mnth) + 1}-${monthDays}`);
    self.selectedMonth = startDate;
    self.clonedRecords = [];
    self.clonedRecords = self.records.filter(fltr => fltr.flowId === flow.id &&
      (startDate.getTime() <= (new Date(fltr.createTimestamp)).getTime() &&
        (new Date(fltr.createTimestamp)).getTime() <= endDate.getTime()));
    if (self.byPassIndex) {
      self.filteredLogs = self.clonedRecords;
    }
    self.getFlowData(i, true, startDate);
    self.showDatedd = false;
  }

  getFlowInteractions(flow) {
    const self = this;
    self.flow = flow;
    if (self.filteredLogs.length === 0) {
      self.filteredLogs = self.records.filter(e => e.flowId === flow.id);
      return { filteredLogs: self.filteredLogs };
    }
  }

  parseBlocks(blocks: Array<NodeData>, firstNode?: NodeData) {
    const temp = [];
    if (blocks && blocks.length > 0) {
      blocks.forEach((e, i, a) => {
        if (e.meta.blockType === 'INPUT' || e.meta.blockType === 'OUTPUT') {
          temp.push(e);
        } else if (e.meta.blockType === 'PROCESS' && e.meta.processType === 'REQUEST') {
          let prevBlock;
          if (i > 0) {
            prevBlock = a[i - 1];
          } else {
            prevBlock = firstNode;
          }
          if (prevBlock) {
            e.mapping = prevBlock.mapping;
            e.meta.xslt = prevBlock.meta.xslt;
            if (typeof e.meta.xslt === 'string') {
              e.meta.xslt = JSON.parse(e.meta.xslt);
            }
          }
          temp.push(e);
        }
      });
    }
    return temp;
  }

  getInteractionColumns() {
    return [
      {
        label: '#',
        key: '_checkbox',
        width: 50
      },
      {
        label: 'Type',
        key: 'flowData.inputType',
        width: 100
      },
      {
        label: 'Order ID',
        key: 'dataStackTxnId',
        width: 300
      },
      {
        label: 'Remote TxnID',
        key: 'remoteTxnId',
        width: 220
      },
      {
        label: 'Partner',
        key: 'flowData.partnerName',
        width: 120
      },
      {
        label: 'Integration',
        key: 'flowData.flowName',
        width: 140
      },
      {
        label: 'Status',
        key: 'status',
        width: 140
      },
      {
        label: 'Start Time',
        key: 'createTimestamp',
        width: 200
      },
      {
        label: 'Completion Time',
        key: 'completedTimestamp',
        width: 200
      },
      {
        label: 'Duration',
        key: 'duration',
        width: 200
      }
    ];
  }

  getInteractionSelect() {
    return [
      '_id',
      'flowId',
      'partnerId',
      'appName',
      'remoteTxnId',
      'dataStackTxnId',
      'status',
      'createTimestamp',
      'completedTimestamp',
      'flowData.direction',
      'flowData.flowName',
      'flowData.partnerName',
      'flowData.inputType',
      'flowData.outputType',
      'direction',
      'errorStackTrace',
      'errorMessage',
      'inputEncrypted',
      'inputFileName',
      'redownloadMeta.remoteTxnID'
    ].join(',');
  }

  setWithinInteractions(val: boolean) {
    this.withinInteractions = val;
  }

  isWithinInteractions() {
    return this.withinInteractions;
  }
}
