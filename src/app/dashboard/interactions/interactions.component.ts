import { Component, ElementRef, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import * as moment from 'moment';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';

import * as _ from 'lodash';
import { OrderByPipe } from 'src/app/pipes/order-by.pipe';
import { InteractionsService } from 'src/app/dashboard/interactions/interactions.service';

am4core.useTheme(am4themes_animated);

@Component({
    selector: 'odp-interactions',
    templateUrl: './interactions.component.html',
    styleUrls: ['./interactions.component.scss']
})
export class InteractionsComponent implements OnInit, OnDestroy {
    @ViewChild('failedCheckbox', { static: false }) failedCheckbox: ElementRef;
    @ViewChild('successfulCheckbox', { static: false }) successfulCheckbox: ElementRef;
    @ViewChild('progressCheckbox', { static: false }) progressCheckbox: ElementRef;
    @ViewChild('fileToFileCheckbox', { static: false }) fileToFileCheckbox: ElementRef;
    @ViewChild('fileToApiCheckbox', { static: false }) fileToApiCheckbox: ElementRef;
    @ViewChild('apiToApiCheckbox', { static: false }) apiToApiCheckbox: ElementRef;
    @ViewChild('apiToFileCheckbox', { static: false }) apiToFileCheckbox: ElementRef;
    @ViewChild('inboundCheckbox', { static: false }) inboundCheckbox: ElementRef;
    @ViewChild('outboundCheckbox', { static: false }) outboundCheckbox: ElementRef;
    @ViewChild('partnerTypeAhead', { static: false }) partnerTypeAhead: NgbTypeahead;
    @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
    clearFilterModalRef: NgbModalRef;
    toggleFilter: boolean;
    toggleFromDate: boolean;
    toggleToDate: boolean;
    filter: any;
    flowTypes: any = {};
    flowTypeFilter: any;
    selectedPartners: Array<any>;
    toggleLiveFeed: boolean;
    subscriptions: any = {};
    columnDefs: Array<any>;
    config: {
        page?: number;
        count?: number;
        select?: string;
        filter?: any;
        sort?: string;
        expand?: boolean;
        totalRecords?: number;
        showLazyLoader?: boolean;
    };
    checkedRecords: any = {};
    startDate: Date;
    endDate: Date;
    showResetFilter: boolean;
    liveFeedTxt: string;
    rowStyle: any;
    rowColor: string;
    // records: Array<any>;
    catchRecords: Array<any>;
    filterModel: any;
    inlineFiltersApplied: boolean;
    partner: {
        partnerName: string;
        partnerDesc: string;
        partnerAgentId: string;
        agentName: string;
        agentHealth: string;
        allFlows: Array<any>;
        partnerId?: string;
        records: Array<any>;
    };
    integrationFilters: Array<any>;
    chart: am4charts.XYChart;
    IntegrationName: string;
    toggleDropdown: boolean;
    noDataForChart: boolean;
    monthYearFilter: Array<any>;
    mnths: Array<string>;
    clonedRecords: Array<any>;
    selectedMonth: Date;
    showDatedd: boolean;
    filteredLogs: Array<any>;
    toggleLogs: boolean;
    grandTotal: number;
    tPass: number;
    tError: number;
    tPending: number;
    fetchedPartnerData: Array<any>;
    pid: number;

    constructor(private commonService: CommonService,
        private route: ActivatedRoute,
        private appService: AppService,
        private router: Router,
        private orderBy: OrderByPipe,
        private modalService: NgbModal,
        private zone: NgZone,
        public is: InteractionsService) {
        const self = this;
        self.filter = {};
        self.flowTypeFilter = {};
        self.selectedPartners = [];
        self.columnDefs = [
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
                type: 'odpTxnId',
                key: 'odpTxnId',
                dataKey: 'odpTxnId',
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
        self.rowColor = 'transparent';
        self.rowStyle = () => {
            return { backgroundColor: self.rowColor };
        };
        self.config = {
            page: 1,
            count: 30,
            filter: {},
            expand: true,
            totalRecords: 0
        };
        self.showResetFilter = false;
        self.liveFeedTxt = 'Live Feed off';
        // self.records = [];
        self.catchRecords = [];
        self.filterModel = {};
        self.inlineFiltersApplied = false;
        self.flowTypes = {
            $or: []
        };
        self.partner = {
            partnerName: '',
            partnerDesc: '',
            partnerAgentId: '',
            agentName: '',
            agentHealth: '',
            allFlows: [],
            partnerId: '',
            records: []
        };
        self.integrationFilters = [{ key: 'All Integration', value: 'all' },
        { key: 'Online', value: 'online' }, { key: 'offline', value: 'Offline' }];
        self.IntegrationName = 'All Integrations';
        self.toggleDropdown = false;
        self.monthYearFilter = [];
        self.mnths = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        self.clonedRecords = [];
        self.selectedMonth = null;
        self.filteredLogs = [];
        self.toggleLogs = false;
        self.grandTotal = 0;
        self.tPass = 0;
        self.tError = 0;
        self.tPending = 0;
        self.noDataForChart = false;
        self.fetchedPartnerData = [];
        self.pid = -1;
    }

    private currentMonthVar: any;

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

    /*loadMore() {
      const self = this;
      if ( self.records.length < self.config.totalRecords ) {
        self.config.page = self.config.page + 1;
        self.getInteractionData();
      }
    }*/

    get checkAll() {
        const self = this;
        if (Object.values(self.checkedRecords).length > 0) {
            return Math.min.apply(null, Object.values(self.checkedRecords));
        }
        return false;
    }

    set checkAll(val) {
        const self = this;
        Object.keys(self.checkedRecords).forEach(key => {
            self.checkedRecords[key] = val;
        });
    }

    get hasFilter() {
        const self = this;
        return Object.keys(self.filter).length !== 0;
    }

    get dummyRows() {
        const self = this;
        const arr = new Array(12);
        arr.fill(1);
        return arr;
    }

    get healthColor() {
        const self = this;
        if (self.partner.agentHealth === 'Weak') {
            return '#db0404';
        } else if (self.partner.agentHealth === 'High') {
            return '#1CAD49';
        } else if (self.partner.agentHealth === 'Medium') {
            return '#FBA200';
        }
    }

    ngOnInit() {
        const self = this;
        self.fillFilter();
        self.getPartnerList();
        self.is.filteredLogs = [];
        self.is.clonedRecords = [];
        self.is.startDate = null;
        /*if (self.appService.interactionFloatingFilter) {
          self.filterModel = self.appService.interactionFloatingFilter;
          self.filterChange(self.filterModel);
        }*/
        self.subscriptions.appUpdated = self.appService.appChange.subscribe((appId) => {
            self.toggleLiveFeed = false;
            self.toggleFilter = false;
            // self.appService.interactionFloatingFilter = null;
            if (self.filterModel) {
                Object.keys(self.filterModel).forEach(key => {
                    delete self.filterModel[key];
                });
            }
            self.getPartnerList();
            self.resetFilters();
            self.getInteractionData();
        });
        self.subscriptions.routparam = self.route.params.subscribe(params => {
            if (params.partnerId) {
                self.is.fromAllInteractions = false;
                self.toggleLogs = false;
                self.toggleDropdown = false;
                self.partner.allFlows = [];
                self.appService.partnerId = params.partnerId;
                self.config.filter = {
                    partnerId: self.appService.partnerId
                };
                self.pid = self.fetchedPartnerData.findIndex(e => e.partnerId === params.partnerId);
                if (self.pid === -1) {
                    self.getPartnerData(params.partnerId);
                    // self.getInteractionData();
                } else if (self.pid > -1) {
                    const partnerData = self.fetchedPartnerData[self.pid];
                    partnerData.allFlows.forEach(e => e.isExpanded = false);
                    self.partner.partnerName = partnerData.partnerName;
                    self.partner.partnerDesc = partnerData.partnerName;
                    self.partner.partnerAgentId = partnerData.partnerAgentId;
                    self.partner.agentName = partnerData.agentName;
                    self.partner.agentHealth = partnerData.agentHealth;
                    self.partner.allFlows = partnerData.allFlows;
                    self.partner.records = partnerData.records;
                }
            }
        });
    }

    streaks(flow) {
        return flow.latestStreak.length > 0;
    }

    fillFilter() {
        const self = this;
        const now = new Date();
        for (const d = new Date(2018, 0, 1); d <= now; d.setMonth(d.getMonth() + 1)) {
            self.monthYearFilter.push(new Date(d));
        }
    }

    getHeaderbgColor(status) {
        if (status === 'SUCCESS') {
            return { 'background-color': '#1CAD49' };
        } else if (status === 'ERROR') {
            return { 'background-color': '#F71C1C' };
        } else if (status === 'PENDING') {
            return { 'background-color': '#FEE140' };
        }
    }

    filterDate(index) {
        const self = this;
        const calculatedIndex = self.monthYearFilter[index].getMonth();
        return `${self.mnths[calculatedIndex]} ${self.monthYearFilter[index].getFullYear()}`;
    }

    getPartnerData(partnerId) {
        const self = this;
        if (self.pid === -1) {
            self.partner.allFlows = [];
            self.partner.agentName = '';
            const options: GetOptions = {
                select: 'name, app, description, flows, agentID',
                filter: {
                    app: self.commonService.app._id
                }
            };
            if (self.subscriptions.partnerData) {
                self.subscriptions.partnerData.unsubscribe();
            }
            self.config.showLazyLoader = true;
            self.subscriptions.partnerData = self.commonService.get('pm', `/partner/${partnerId}`, options).subscribe((res) => {
                self.partner.partnerName = res.name;
                self.partner.partnerId = partnerId;
                self.partner.partnerDesc = res.description;
                self.partner.partnerAgentId = res.agentID;
                self.is.partnerName = self.partner.partnerName;
                const agentHealthOption: GetOptions = {
                    filter: {
                        agentID: res.agentID
                    },
                    count: 5,
                    sort: '-timestamp',
                };
                const agentName = self.commonService.get('pm', '/agentRegistry',
                    { filter: { type: 'PARTNERAGENT', app: self.commonService.app._id, agentID: res.agentID } });
                const agentHealth = self.commonService.get('pm', '/agentMonitoring', agentHealthOption);
                forkJoin([agentName, agentHealth]).subscribe((results) => {
                    self.partner.agentName = results[0][0].name;
                    const streak = results[1].map(e => e.status === 'RUNNING' ? 'T' : 'F').reverse();
                    self.partner.agentHealth = self.getStrength(streak);
                });
                if (res.flows.length > 0) {
                    const option: GetOptions = {
                        filter: {
                            app: self.commonService.app._id,
                            runningFlow: { $exists: false }
                        },
                        // select: 'name,status,description,version'
                    };
                    res.flows.forEach(e => {
                        const flowObj = {
                            name: '',
                            id: e,
                            ver: '',
                            status: '',
                            description: '',
                            isExpanded: false,
                            latestStreak: [],
                            inputType: '',
                            hover: false
                        };
                        const flowId = self.partner.allFlows.findIndex(f => f.id === e);
                        if (flowId === -1) {
                            self.subscriptions.flowDetails = self.commonService.get('pm', '/flow/' + e, option).subscribe((flow) => {
                                flowObj.name = flow.name;
                                flowObj.ver = flow.version;
                                flowObj.status = flow.status;
                                flowObj.description = flow.description;
                                flowObj.inputType = flow.inputType;

                                self.partner.allFlows.push(flowObj);
                                const pid = self.fetchedPartnerData.findIndex(prId => prId.partnerId === partnerId);
                                if (pid === -1) {
                                    self.fetchedPartnerData.push(self.appService.cloneObject(self.partner));
                                } else {
                                    self.fetchedPartnerData.splice(self.pid, 1, self.appService.cloneObject(self.partner));
                                }
                                self.getInteractionData();
                            }, () => {
                                flowObj.status = 'Stopped';
                                if (self.pid === -1) {
                                    self.fetchedPartnerData.push(self.appService.cloneObject(self.partner));
                                }
                            });
                        }
                    });
                }
                self.config.showLazyLoader = false;
            }, err => {
                self.commonService.errorToast(err, 'Unable to fetch record, Please try again later');
                self.config.showLazyLoader = false;
            });
        }
    }

    getStrength(streak: Array<string>) {
        if (streak && streak.length > 0) {
            const successLen = streak.filter(e => e === 'T').length;
            if (successLen === streak.length || successLen === streak.length - 1) {
                return 'High';
            }
            if (successLen === streak.length - 2 || successLen === streak.length - 3) {
                return 'Medium';
            }
        }
        return 'Weak';
    }

    getPartnerList() {
        const self = this;
        const options: GetOptions = {
            count: -1,
            select: 'name,app',
            filter: {
                app: self.commonService.app._id
            }
        };
        if (self.subscriptions.getPartners) {
            self.subscriptions.getPartners.unsubscribe();
        }
        self.subscriptions.getPartners = self.commonService.get('pm', '/partner', options).subscribe(res => {
            res = self.orderBy.transform(res, 'name');
            if (!self.appService.partnerId) {
                self.appService.partnerId = res[0]['_id'];
                self.router.navigate([`/~/interactions/${res[0]['_id']}`]);
            } else {
                self.router.navigate([`/~/interactions/${self.appService.partnerId}`]);
            }
        });
    }

    getInteractionData() {
        const self = this;
        self.config.showLazyLoader = true;
        if (self.pid === -1) {
            self.subscriptions.iCount = self.commonService.get('pm', `/${self.commonService.app._id}/interaction/count`,
                { filter: { partnerId: self.appService.partnerId } })
                .subscribe((count) => {
                    self.config.totalRecords = count;
                    let options;
                    if (count) {
                        options = {
                            sort: self.config.sort,
                            select: self.config.select,
                            page: self.config.page,
                            count: -1,
                            filter: self.config.filter
                        };
                        if (self.config.filter['$and'] && self.config.filter['$and'].length === 0) {
                            options.filter = {};
                            // delete self.config.filter['$and'];
                        }
                        self.subscriptions.iData = self.commonService
                            .get('pm', `/${self.commonService.app._id}/interaction`, options).subscribe((rows) => {
                                if (self.config.page === 1) {
                                    self.partner.records = rows;
                                } else if (self.config.page > 1) {
                                    self.partner.records.push(...rows);
                                }
                                const temp = self.fetchedPartnerData.find(p => p.partnerId === self.partner.partnerId);
                                if (temp) {
                                    temp.records = [...self.partner.records];
                                }
                                self.partner.allFlows.forEach(flw => {
                                    self.getFlowStreak(flw);
                                });
                                self.is.records = self.partner.records;
                                self.is.allFlows = self.partner.allFlows;
                                self.config.showLazyLoader = false;
                            }, err => {
                                self.config.showLazyLoader = false;
                                self.commonService.errorToast(err, 'Unable to fetch records, Please try again later');
                            });
                    } else if (count === 0) {
                        self.config.showLazyLoader = false;
                    }
                });
        }
        if (!self.filter['$and']) {
            self.filter['$and'] = [];
        }
    }

    getFlowStreak(flow) {
        const self = this;
        const endDate = new Date(new Date().setHours(23, 59, 59));
        const tDate = new Date(new Date().setDate(endDate.getDate() - 10));
        const startDate = new Date(tDate.setHours(0, 0, 0));
        const tempArr = self.partner.records.filter(e => e.flowId === flow.id);
        tempArr.forEach((rcrd) => {
            if (!rcrd.createTimestamp) {
                rcrd.createTimestamp = Date.now();
            }
            const dateToCompare = new Date(rcrd.createTimestamp);
            const daysDiff = dateToCompare.getDate() - startDate.getDate();
            if (daysDiff > 0 && daysDiff <= 10 && moment(startDate).isSameOrBefore(dateToCompare)) {
                const obj = {
                    mfName: rcrd.flowData.flowName,
                    timeStamp: rcrd.createTimestamp,
                    status: rcrd.status,
                    txnId: rcrd.odpTxnId
                };
                let i = false;
                if (flow.latestStreak.length > 0 && flow.latestStreak.length < 10) {
                    flow.latestStreak.forEach((e, index) => {
                        i = self.appService.isEquivalent(e, obj);
                        if (!i) {
                            flow.latestStreak.push(obj);
                        }
                    });
                } else if (flow.latestStreak.length === 0) {
                    flow.latestStreak.push(obj);
                }
            }
        });
        if (flow.latestStreak.length > 10) {
            flow.latestStreak.splice(10);
        }
        if (flow.inputType === 'API') {
            flow.latestStreak = _.uniqBy(flow.latestStreak, 'timeStamp');
        } else if (flow.inputType === 'FILE') {
            flow.latestStreak = _.uniqBy(flow.latestStreak, 'txnId');
        }
    }

    clearSearch() {
        const self = this;
        self.clearOtherFilters();
        self.resetFilters();
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
        if (self.clonedRecords.length > 0) {
            tempArr = self.clonedRecords;
        } else {
            tempArr = self.partner.records;
        }
        tempArr.forEach((rcrd) => {
            if (!rcrd.createTimestamp) {
                rcrd.createTimestamp = Date.now();
            }
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
            if (dateIndex !== -1 && type === 'queued' && rcrd.flowData.flowName === flow && rcrd.status === 'QUEUED') {
                count++;
            }
        });
        return count;
    }

    resetFilters() {
        const self = this;
        self.filter = {};
        self.config.filter = {};
        self.startDate = null;
        self.endDate = null;
        // self.startDate.setDate(self.startDate.getDate() - 1);
        if (self.failedCheckbox) {
            self.failedCheckbox.nativeElement.checked = false;
        }
        if (self.successfulCheckbox) {
            self.successfulCheckbox.nativeElement.checked = false;
        }
        if (self.progressCheckbox) {
            self.progressCheckbox.nativeElement.checked = false;
        }
        if (self.fileToFileCheckbox) {
            self.fileToFileCheckbox.nativeElement.checked = false;
        }
        if (self.fileToApiCheckbox) {
            self.fileToApiCheckbox.nativeElement.checked = false;
        }
        if (self.apiToApiCheckbox) {
            self.apiToApiCheckbox.nativeElement.checked = false;
        }
        if (self.apiToFileCheckbox) {
            self.apiToFileCheckbox.nativeElement.checked = false;
        }
        if (self.inboundCheckbox) {
            self.inboundCheckbox.nativeElement.checked = false;
        }
        if (self.outboundCheckbox) {
            self.outboundCheckbox.nativeElement.checked = false;
        }
        self.showResetFilter = false;
        self.partner.records = [...self.catchRecords, ...self.partner.records];
        self.catchRecords = [];
        self.selectedPartners = [];
        self.getInteractionData();
    }

    /**
     * This method checks if there are any existing filters, if found, then uses the same to display
     * those on UI in case user hid the filter options and displayed them again. This will only work
     * for applied filter and not only if user selected filter but didn't applied.
     * author: bijay_ps
     */
    existingFilterChk() {
        const self = this;
        self.toggleFilter = !self.toggleFilter;
        // so that it will only work for applied filter and not only if user has selected filter but didn't applied.
        // if applied filter check is not required then remove self.showResetFilter from below if
        if (self.toggleFilter && self.showResetFilter) {
            setTimeout(() => {
                if (self.filter.direction && self.filter.direction['$in'] && self.filter.direction['$in'][0] === 'INBOUND') {
                    self.inboundCheckbox.nativeElement.checked = true;
                } else if (self.filter.direction && self.filter.direction['$in'] && self.filter.direction['$in'][0] === 'OUTBOUND') {
                    self.outboundCheckbox.nativeElement.checked = true;
                }
                if (self.filter.status) {
                    const failedIndex = self.filter.status['$in'].findIndex(e => e === 'ERROR');
                    const successIndex = self.filter.status['$in'].findIndex(e => e === 'SUCCESS');
                    const pendingIndex = self.filter.status['$in'].findIndex(e => e === 'PENDING');
                    if (failedIndex > -1) {
                        self.failedCheckbox.nativeElement.checked = true;
                    }
                    if (successIndex > -1) {
                        self.successfulCheckbox.nativeElement.checked = true;
                    }
                    if (pendingIndex > -1) {
                        self.progressCheckbox.nativeElement.checked = true;
                    }
                }
                if (self.filter.flowData) {
                    const inType = self.filter.flowData.inputType['$in'][0];
                    const outType = self.filter.flowData.outputType['$in'][0];
                    if (inType === 'FILE' && outType === 'FILE') {
                        self.fileToFileCheckbox.nativeElement.checked = true;
                    } else if (inType === 'FILE' && outType === 'API') {
                        self.fileToApiCheckbox.nativeElement.checked = true;
                    } else if (inType === 'API' && outType === 'API') {
                        self.apiToApiCheckbox.nativeElement.checked = true;
                    }
                }
            }, 200);
        }
    }

    applyFilters() {
        const self = this;
        self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
        self.clearFilterModalRef.result.then((close) => {
            if (close) {
                self.showResetFilter = true;
                self.clearOtherFilters();
                self.filter['$and'] = [];
                self.config.filter['$and'] = [];
                if (self.flowTypes['$or'].length > 0) {
                    self.filter['$and'].push(self.flowTypes);
                    self.config.filter['$and'].push(self.flowTypes);
                }
                Object.keys(self.filter).forEach((key, i) => {
                    const temp = self.filter[key];
                    if (temp && temp.hasOwnProperty('$in') && temp['$in'].length && key !== 'flowData') {
                        self.config.filter['$and']
                            .push(Object.defineProperty({}, key, {
                                value: self.filter[key],
                                configurable: true,
                                enumerable: true,
                                writable: true
                            }));
                    } /*else if (key === 'flowData') {
            self.config.filter['$and']
                .push(Object.defineProperty({}, 'flowData.inputType', { value: self.filter[key].inputType,
                  configurable: true, enumerable: true, writable: true}));
            self.config.filter['$and']
                .push(Object.defineProperty({}, 'flowData.outputType', { value: self.filter[key].outputType,
                  configurable: true, enumerable: true, writable: true}));
          }*/
                });
                if (self.endDate) {
                    self.config.filter['$and']
                        .push(Object.defineProperty(
                            {},
                            'createTimestamp',
                            { value: { $lte: self.endDate }, configurable: true, enumerable: true, writable: true }));
                }
                if (self.startDate) {
                    self.config.filter['$and']
                        .push(Object.defineProperty(
                            {},
                            'createTimestamp',
                            { value: { $gte: self.startDate }, configurable: true, enumerable: true, writable: true }));
                }
                self.getInteractionData();
            }
        }, dismiss => { });
    }

    clearOtherFilters() {
        const self = this;
        self.config.page = 1;
        self.config.count = 30;
        self.filterModel = {};
    }

    calcFilters() {
        const self = this;
        if (self.failedCheckbox && self.failedCheckbox.nativeElement && self.failedCheckbox.nativeElement.checked) {
            if (!self.filter.status) {
                self.filter.status = {};
            }
            if (!self.filter.status['$in']) {
                self.filter.status['$in'] = [];
            }
            const index = self.filter.status['$in'].findIndex(e => e === 'ERROR');
            if (index === -1) {
                self.filter.status['$in'].push('ERROR');
            }
        } else {
            if (self.filter.status && self.filter.status['$in']) {
                const index = self.filter.status['$in'].findIndex(e => e === 'ERROR');
                if (index > -1) {
                    self.filter.status['$in'].splice(index, 1);
                }
            }
        }
        if (self.successfulCheckbox && self.successfulCheckbox.nativeElement && self.successfulCheckbox.nativeElement.checked) {
            if (!self.filter.status) {
                self.filter.status = {};
            }
            if (!self.filter.status['$in']) {
                self.filter.status['$in'] = [];
            }
            const index = self.filter.status['$in'].findIndex(e => e === 'SUCCESS');
            if (index === -1) {
                self.filter.status['$in'].push('SUCCESS');
            }
        } else {
            if (self.filter.status && self.filter.status['$in']) {
                const index = self.filter.status['$in'].findIndex(e => e === 'SUCCESS');
                if (index > -1) {
                    self.filter.status['$in'].splice(index, 1);
                }
            }
        }
        if (self.progressCheckbox && self.progressCheckbox.nativeElement && self.progressCheckbox.nativeElement.checked) {
            if (!self.filter.status) {
                self.filter.status = {};
            }
            if (!self.filter.status['$in']) {
                self.filter.status['$in'] = [];
            }
            const index = self.filter.status['$in'].findIndex(e => e === 'PENDING');
            if (index === -1) {
                self.filter.status['$in'].push('PENDING');
            }
        } else {
            if (self.filter.status && self.filter.status['$in']) {
                const index = self.filter.status['$in'].findIndex(e => e === 'PENDING');
                if (index > -1) {
                    self.filter.status['$in'].splice(index, 1);
                }
            }
        }
        if (self.inboundCheckbox && self.inboundCheckbox.nativeElement && self.inboundCheckbox.nativeElement.checked) {
            if (!self.filter.direction) {
                self.filter.direction = {};
            }
            if (!self.filter.direction['$in']) {
                self.filter.direction['$in'] = [];
            }
            const index = self.filter.direction['$in'].findIndex(e => e === 'INBOUND');
            if (index === -1) {
                self.filter.direction['$in'].push('INBOUND');
            }
        } else {
            if (self.filter.direction && self.filter.direction['$in']) {
                const index = self.filter.direction['$in'].findIndex(e => e === 'INBOUND');
                if (index > -1) {
                    self.filter.direction['$in'].splice(index, 1);
                }
            }
        }
        if (self.outboundCheckbox && self.outboundCheckbox.nativeElement && self.outboundCheckbox.nativeElement.checked) {
            if (!self.filter.direction) {
                self.filter.direction = {};
            }
            if (!self.filter.direction['$in']) {
                self.filter.direction['$in'] = [];
            }
            const index = self.filter.direction['$in'].findIndex(e => e === 'OUTBOUND');
            if (index === -1) {
                self.filter.direction['$in'].push('OUTBOUND');
            }
        } else {
            if (self.filter.direction && self.filter.direction['$in']) {
                const index = self.filter.direction['$in'].findIndex(e => e === 'OUTBOUND');
                if (index > -1) {
                    self.filter.direction['$in'].splice(index, 1);
                }
            }
        }
        if (self.selectPartner && self.selectPartner.length > 0) {
            if (!self.filter.partnerId) {
                self.filter.partnerId = {};
            }
            self.filter.partnerId['$in'] = self.selectedPartners.map(e => e._id);
        } else {
            delete self.filter.partnerId;
        }
        if (self.filter.status && self.filter.status['$in'] && self.filter.status['$in'].length === 0) {
            delete self.filter.status;
        }
        if (self.filter.direction && self.filter.direction['$in'] && self.filter.direction['$in'].length === 0) {
            delete self.filter.direction;
        }
        if (self.filter.partner && self.filter.partner['$in'] && self.filter.partner['$in'].length === 0) {
            delete self.filter.partner;
        }
        self.filter.flowId = {
            $in: []
        };
    }

    fileToFile() {
        const self = this;
        if (self.fileToFileCheckbox && self.fileToFileCheckbox.nativeElement && self.fileToFileCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['FILE'] }
                }, {
                    'flowData.outputType': { $in: ['FILE', null] }
                }]
            };
            self.flowTypes['$or'].push(tempObj);
        } else if (self.fileToFileCheckbox && self.fileToFileCheckbox.nativeElement && !self.fileToFileCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['FILE'] }
                }, {
                    'flowData.outputType': { $in: ['FILE', null] }
                }]
            };
            const fileToFileIndex = self.flowTypes['$or'].findIndex(e => _.isEqual(e, tempObj));
            if (fileToFileIndex > -1) {
                self.flowTypes['$or'].splice(fileToFileIndex, 1);
            }
        }
    }

    fileToApi() {
        const self = this;
        if (self.fileToApiCheckbox && self.fileToApiCheckbox.nativeElement && self.fileToApiCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['FILE'] }
                }, {
                    'flowData.outputType': { $in: ['API', null] }
                }]
            };
            self.flowTypes['$or'].push(tempObj);
        } else if (self.fileToApiCheckbox && self.fileToApiCheckbox.nativeElement && !self.fileToApiCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['FILE'] }
                }, {
                    'flowData.outputType': { $in: ['API', null] }
                }]
            };
            const fileToAPIIndex = self.flowTypes['$or'].findIndex(e => _.isEqual(e, tempObj));
            if (fileToAPIIndex > -1) {
                self.flowTypes['$or'].splice(fileToAPIIndex, 1);
            }
        }
    }

    apiToApi() {
        const self = this;
        if (self.apiToApiCheckbox && self.apiToApiCheckbox.nativeElement && self.apiToApiCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['API'] }
                }, {
                    'flowData.outputType': { $in: ['API', null] }
                }]
            };
            self.flowTypes['$or'].push(tempObj);
        } else if (self.apiToApiCheckbox && self.apiToApiCheckbox.nativeElement && !self.apiToApiCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['API'] }
                }, {
                    'flowData.outputType': { $in: ['API', null] }
                }]
            };
            const apiToAPIIndex = self.flowTypes['$or'].findIndex(e => _.isEqual(e, tempObj));
            if (apiToAPIIndex > -1) {
                self.flowTypes['$or'].splice(apiToAPIIndex, 1);
            }
        }
    }

    apiToFile() {
        const self = this;
        if (self.apiToFileCheckbox && self.apiToFileCheckbox.nativeElement && self.apiToFileCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['API'] }
                }, {
                    'flowData.outputType': { $in: ['FILE', null] }
                }]
            };
            self.flowTypes['$or'].push(tempObj);
        } else if (self.apiToFileCheckbox && self.apiToFileCheckbox.nativeElement && !self.apiToFileCheckbox.nativeElement.checked) {
            const tempObj = {
                $and: [{
                    'flowData.inputType': { $in: ['API'] }
                }, {
                    'flowData.outputType': { $in: ['FILE', null] }
                }]
            };
            const apiToFileIndex = self.flowTypes['$or'].findIndex(e => _.isEqual(e, tempObj));
            if (apiToFileIndex > -1) {
                self.flowTypes['$or'].splice(apiToFileIndex, 1);
            }
        }
    }

    selectPartner(event: any) {
        const self = this;
        event.preventDefault();
        if (!self.selectedPartners.find(e => e._id === event.item._id)) {
            self.selectedPartners.push(event.item);
        }
        self.partnerTypeAhead.writeValue(null);
        self.calcFilters();
    }

    removePartner(index: number) {
        const self = this;
        self.selectedPartners.splice(index, 1);
    }

    searchPartner = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term => {
                const options: GetOptions = {
                    select: 'name',
                    filter: {
                        name: '/' + term + '/',
                        app: this.commonService.app._id
                    }
                };
                return this.commonService.get('pm', '/partner', options).toPromise().then(res => {
                    return res;
                }).catch(err => {
                    return of([]);
                });
            })
        )

    formatter = (x: { name: string }) => x.name;

    updateTime(duration: number, type: string) {
        const self = this;
        self.startDate = new Date();
        self.endDate = new Date();
        switch (type) {
            case 'hr':
                self.startDate.setHours(self.startDate.getHours() - duration);
                break;
            case 'day':
                self.startDate.setDate(self.startDate.getDate() - duration);
                break;
            default:
                self.startDate.setDate(self.startDate.getDate() - 1);
                break;
        }
    }
    toggleFromDateP(event) {
        const self = this;
        self.toggleFromDate = event;
    }

    toggleToDateP(event) {
        const self = this;
        self.toggleToDate = event;
    }

    viewInteraction(colData) {
        const self = this;
        self.appService.remoteTxnId = colData.remoteTxnId;
        self.router.navigate([`src/interactions/${self.appService.partnerId}/${colData.odpTxnId}`]);
    }

    filterChange(event) {
        const self = this;
        if (!self.inlineFiltersApplied) {
            self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
            self.clearFilterModalRef.result.then((close) => {
                if (close) {
                    // self.appService.interactionFloatingFilter = event;
                    self.resetFilters();
                    self.toggleFilter = false;
                    self.filterModel = event;
                    self.config.page = 1;
                    self.config.count = 30;
                    self.config.filter = {
                        $and: []
                    };
                    const eventKeys = Object.keys(event);
                    if (eventKeys && eventKeys.length > 0) {
                        eventKeys.forEach((key) => {
                            if (event[key] && Object.keys(event[key]).length > 0) {
                                if (event[key].type !== 'Time') {
                                    const obj = Object.defineProperty({}, key, {
                                        value: `/${event[key].value}/`,
                                        enumerable: true,
                                        writable: true
                                    });
                                    self.config.filter['$and'].push(obj);
                                } else if (event[key].type === 'Time' && event[key].value) {
                                    const val1 = new Date(event[key].value);
                                    const val2 = new Date(event[key].value);
                                    val2.setDate(val1.getDate() + 1);
                                    const obj1 = Object.defineProperty({}, key, {
                                        value: { $gt: val1.toISOString() },
                                        enumerable: true,
                                        writable: true
                                    });
                                    const obj2 = Object.defineProperty({}, key, {
                                        value: { $lt: val2.toISOString() },
                                        enumerable: true,
                                        writable: true
                                    });
                                    self.config.filter['$and'].push(obj1);
                                    self.config.filter['$and'].push(obj2);
                                }
                            } else {
                                if (self.config.filter['$and']) {
                                    const i = self.config.filter['$and'].findIndex(e => e === key);
                                    if (i !== -1) {
                                        self.config.filter['$and'][i].splice(i, 1);
                                    }
                                }
                            }
                        });
                    }
                    if (self.config.filter['$and'] && self.config.filter['$and'].length === 0) {
                        delete self.config.filter['$and'];
                    }
                    self.getInteractionData();
                    self.inlineFiltersApplied = true;
                }
            }, dismiss => { });
        } else {
            self.filterModel = event;
            self.config.page = 1;
            self.config.count = 30;
            self.config.filter = {
                $and: []
            };
            const eventKeys = Object.keys(event);
            if (eventKeys && eventKeys.length > 0) {
                eventKeys.forEach((key) => {
                    if (event[key] && Object.keys(event[key]).length > 0) {
                        if (event[key].type !== 'Time') {
                            const obj = Object.defineProperty({}, key, {
                                value: `/${event[key].value}/`,
                                enumerable: true,
                                writable: true
                            });
                            self.config.filter['$and'].push(obj);
                        } else if (event[key].type === 'Time' && event[key].value) {
                            const val1 = new Date(event[key].value);
                            const val2 = new Date(event[key].value);
                            val2.setDate(val1.getDate() + 1);
                            const obj1 = Object.defineProperty({}, key, {
                                value: { $gt: val1.toISOString() },
                                enumerable: true,
                                writable: true
                            });
                            const obj2 = Object.defineProperty({}, key, {
                                value: { $lt: val2.toISOString() },
                                enumerable: true,
                                writable: true
                            });
                            self.config.filter['$and'].push(obj1);
                            self.config.filter['$and'].push(obj2);
                        }
                    } else {
                        if (self.config.filter['$and']) {
                            const i = self.config.filter['$and'].findIndex(e => e === key);
                            if (i !== -1) {
                                self.config.filter['$and'][i].splice(i, 1);
                            }
                        }
                    }
                });
            }
            if (self.config.filter['$and'] && self.config.filter['$and'].length === 0) {
                delete self.config.filter['$and'];
            }
            self.getInteractionData();
            self.inlineFiltersApplied = true;
        }
    }

    sortModelChange(event) {
        const self = this;
        self.config.sort = self.getSortQuery(event);
        self.config.page = 1;
        self.getInteractionData();
    }

    getSortQuery(model: any): string {
        return Object.keys(model).map(key => model[key] === 'desc' ? '-' + key : key).join(',');
    }

    ngOnDestroy() {
        const self = this;
        if (self.clearFilterModalRef) {
            self.clearFilterModalRef.close();
        }
        Object.keys(self.subscriptions).forEach(key => {
            if (self.subscriptions[key]) {
                self.subscriptions[key].unsubscribe();
            }
        });
        self.zone.runOutsideAngular(() => {
            if (self.chart) {
                self.chart.dispose();
            }
        });
        self.fetchedPartnerData = [];
        self.pid = -1;
    }

    searchFlows(e) {
        const self = this;
    }

    resetFlowSearch() {
        const self = this;
    }

    toggleExpand(index, event?) {
        const self = this;
        self.grandTotal = 0;
        self.tPass = 0;
        self.tError = 0;
        self.tPending = 0;
        // self.toggleDropdown = false;
        if (event) {
            self.partner.allFlows[index].isExpanded = !self.partner.allFlows[index].isExpanded;
            // self.records[index].isExpanded = !self.records[index].isExpanded;
            if (self.partner.allFlows[index].isExpanded) {
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
            if (self.partner.allFlows[index].isExpanded) {
                return { 'min-height': '340px' };
            } else {
                return { 'min-height': '120px' };
            }
        }
    }

    selectIntegration(integration?: any) {
        const self = this;
        if (self.partner && self.partner.allFlows && self.partner.allFlows.length > 0) {
            self.partner.allFlows.forEach(e => e.isExpanded = false);
        }
        if (integration) {
            self.IntegrationName = integration.name;
            self.toggleDropdown = false;
        } else {
            self.IntegrationName = 'All Integrations';
            self.toggleDropdown = false;
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
        self.clonedRecords = self.partner.records.filter(prtnr => prtnr.flowId === flow.id &&
            (startDate.getTime() <= (new Date(prtnr.createTimestamp)).getTime()
                && (new Date(prtnr.createTimestamp)).getTime() <= endDate.getTime()));
        self.is.clonedRecords = self.clonedRecords;
        self.is.startDate = startDate;
        self.is.filteredLogs = self.clonedRecords;
        self.getFlowData(i, true, startDate);
        self.showDatedd = false;
    }

    getFlowData(index, filter?, startDate?) {
        const self = this;
        self.toggleDropdown = false;
        let iterationArr = [];
        if (filter) {
            iterationArr = self.clonedRecords;
        } else {
            iterationArr = self.partner.records;
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
            if (dateWiseFlow.length > 0) {
                for (const item of dateWiseFlow) {
                    item.flowCount = item.pass + item.failed + item.pending;
                }
                iterationArr.forEach((rcrd) => {
                    if (!rcrd.createTimestamp) {
                        rcrd.createTimestamp = Date.now();
                    }
                    const date = new Date(rcrd.createTimestamp).toISOString().substring(0, 10);
                    const dateIndex = dateWiseFlow.findIndex(e => e.date.toISOString().substring(0, 10) === date);
                    if (dateIndex !== -1 && self.partner.allFlows[index].name === rcrd.flowData.flowName) {
                        dateWiseFlow[dateIndex].flowCount++;
                        if (rcrd.status === 'SUCCESS') {
                            dateWiseFlow[dateIndex].pass++;
                        } else if (rcrd.status === 'ERROR') {
                            dateWiseFlow[dateIndex].failed++;
                        } else if (rcrd.status === 'PENDING') {
                            dateWiseFlow[dateIndex].pending++;
                        }
                        dateWiseFlow[dateIndex].total =
                            dateWiseFlow[dateIndex].pass + dateWiseFlow[dateIndex].failed + dateWiseFlow[dateIndex].pending;
                    }
                });
                dateWiseFlow.forEach(e => {
                    self.grandTotal = self.grandTotal + e.total;
                    self.tPass = self.tPass + e.pass;
                    self.tError = self.tError + e.failed;
                    self.tPending = self.tPending + e.pending;
                });
                if (self.grandTotal > 0) {
                    self.noDataForChart = false;
                    self.zone.runOutsideAngular(() => {
                        const chart = am4core.create('chartDiv-' + index, am4charts.XYChart);
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
                self.noDataForChart = true;
            }
        } else {
            self.noDataForChart = true;
            if (self.chart) {
                self.chart.dispose();
            }
            return;
        }
    }

    getFlowInteractions(flow) {
        const self = this;
        self.is.flowIndex = self.partner.allFlows.findIndex(e => e.id === flow.id);
        self.is.flowDetails.name = flow.name;
        self.is.flowDetails.ver = flow.ver;
        self.is.flowDetails.status = flow.status;
        self.is.flowDetails.desc = flow.description;
        self.is.getFlowInteractions(flow);
        self.router.navigate([`${flow.id}`], { relativeTo: self.route });
        /*const obj = self.is.getFlowInteractions(flow);
        [self.toggleLogs, self.filteredLogs] = [obj.toggleLogs, obj.filteredLogs];*/
    }
}
