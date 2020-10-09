import { Component, OnInit, ViewChild, ElementRef, TemplateRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';

import * as _ from 'lodash';
import { OrderByPipe } from 'src/app/pipes/order-by.pipe';
import { InteractionsService } from 'src/app/dashboard/interactions/interactions.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'odp-global-interactions',
    templateUrl: './interactions-global.component.html',
    styleUrls: ['./interactions-global.component.scss']
})
export class InteractionsGlobalComponent implements OnInit, OnDestroy {

    @ViewChild('failedCheckbox', { static: false }) failedCheckbox: ElementRef;
    @ViewChild('successfulCheckbox', { static: false }) successfulCheckbox: ElementRef;
    @ViewChild('progressCheckbox', { static: false }) progressCheckbox: ElementRef;
    @ViewChild('unknownCheckbox', { static: false }) unknownCheckbox: ElementRef;
    @ViewChild('queuedCheckbox', { static: false }) queuedCheckbox: ElementRef;
    @ViewChild('fileToFileCheckbox', { static: false }) fileToFileCheckbox: ElementRef;
    @ViewChild('fileToApiCheckbox', { static: false }) fileToApiCheckbox: ElementRef;
    @ViewChild('apiToApiCheckbox', { static: false }) apiToApiCheckbox: ElementRef;
    @ViewChild('apiToFileCheckbox', { static: false }) apiToFileCheckbox: ElementRef;
    @ViewChild('inboundCheckbox', { static: false }) inboundCheckbox: ElementRef;
    @ViewChild('outboundCheckbox', { static: false }) outboundCheckbox: ElementRef;
    @ViewChild('partnerTypeAhead', { static: false }) partnerTypeAhead: NgbTypeahead;
    @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
    @ViewChild('redownloadModal', { static: false }) redownloadModal: TemplateRef<ElementRef>;

    clearFilterModalRef: NgbModalRef;
    redownloadModalRef: NgbModalRef;
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
    allIConfig: {
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
    records: Array<any>;
    catchRecords: Array<any>;
    filterModel: any;
    inlineFiltersApplied: boolean;
    customFiltersApplied: boolean;
    selectAllChecked: boolean;

    constructor(private commonService: CommonService,
        private route: ActivatedRoute,
        private appService: AppService,
        private router: Router,
        private orderBy: OrderByPipe,
        private ts: ToastrService,
        private interactionService: InteractionsService,
        private modalService: NgbModal) {
        const self = this;
        self.filter = {};
        self.flowTypeFilter = {};
        self.selectedPartners = [];
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
                type: 'odpTxnId',
                key: 'odpTxnId',
                dataKey: 'odpTxnId',
            },
            {
                show: true,
                properties: {
                    name: 'Remote TxnID',
                },
                type: 'remoteTxnId',
                key: 'remoteTxnId',
                dataKey: 'remoteTxnId',
            },
            {
                show: true,
                properties: {
                    name: 'Partner',
                },
                type: 'partnerName',
                key: 'flowData.partnerName',
                dataKey: 'flowData.partnerName',
            },
            {
                show: true,
                properties: {
                    name: 'Integration',
                },
                type: 'FlowName',
                key: 'flowData.flowName',
                dataKey: 'flowData.flowName',
            },
            {
                show: true,
                properties: {
                    name: 'Status',
                },
                type: 'Status',
                key: 'status',
                dataKey: 'status',
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
                    name: 'Duration',
                },
                type: 'Duration',
                key: 'duration',
                dataKey: 'duration',
            }
        ];
        self.rowColor = 'transparent';
        self.rowStyle = () => {
            return { backgroundColor: self.rowColor };
        };
        self.allIConfig = {
            page: 1,
            count: 30,
            filter: {},
            expand: true,
            totalRecords: 0
        };
        self.showResetFilter = false;
        self.liveFeedTxt = 'Live Feed off';
        self.records = [];
        self.catchRecords = [];
        self.filterModel = {};
        self.inlineFiltersApplied = false;
        self.flowTypes = {
            $or: []
        };
        self.selectAllChecked = false;
    }

    ngOnInit() {
        const self = this;
        self.getInteractionData();
        // self.getPartnerList();
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
                self.appService.partnerId = params.partnerId;
                self.allIConfig.filter = {};
                self.getInteractionData();
            }
        });
    }

    loadMore() {
        const self = this;
        if (self.records.length < self.allIConfig.totalRecords) {
            self.allIConfig.page = self.allIConfig.page + 1;
            self.getInteractionData();
        }
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
        self.allIConfig.showLazyLoader = true;
        let optionsFilter = {};
        if (self.allIConfig.filter['$and'] && self.allIConfig.filter['$and'].length > 0 && Object.keys(self.allIConfig.filter).length > 0) {
            optionsFilter = self.allIConfig.filter;
        }
        self.subscriptions.iCount = self.commonService.get('pm', `/${self.commonService.app._id}/interaction/count`,
            { filter: optionsFilter })
            .subscribe((count) => {
                self.allIConfig.totalRecords = count;
                let options;
                if (count) {
                    options = {
                        sort: self.allIConfig.sort,
                        select: self.allIConfig.select,
                        page: self.allIConfig.page,
                        count: self.allIConfig.count,
                        filter: self.allIConfig.filter
                    };
                    if (self.allIConfig.filter['$and'] && self.allIConfig.filter['$and'].length === 0) {
                        options.filter = {};
                        // delete self.allIConfig.filter['$and'];
                    }
                    self.subscriptions.iData = self.commonService
                        .get('pm', `/${self.commonService.app._id}/interaction`, options).subscribe((rows) => {
                            self.allIConfig.showLazyLoader = false;
                            if (self.allIConfig.page === 1) {
                                self.records = rows;
                            } else if (self.allIConfig.page > 1) {
                                self.records.push(...rows);
                                if (self.selectAllChecked) {
                                    self.records.forEach(e1 => {
                                        if (!e1._checked) {
                                            e1._checked = true;
                                        }
                                    });
                                }
                            }
                        }, err => {
                            self.allIConfig.showLazyLoader = false;
                            self.commonService.errorToast(err, 'Unable to fetch records, Please try again later');
                        });
                }
                else {
                    self.records = [];
                    self.allIConfig.showLazyLoader = false;
                }
            });
        if (!self.filter['$and']) {
            self.filter['$and'] = [];
        }
    }

    get recordChecked() {
        const self = this;
        return self.records.filter(e1 => e1._checked).length;
    }

    selectAllRcrds() {
        const self = this;
        self.checkAll = !self.checkAll;
        self.selectAllChecked = self.checkAll;
    }

    get checkAll() {
        const self = this;
        if (self.records.length > 0) {
            return self.records.every(e1 => e1._checked);
        }
        return false;
    }

    set checkAll(val) {
        const self = this;
        self.records.forEach(e1 => {
            e1._checked = val;
        });
    }

    clearSearch() {
        const self = this;
        self.clearOtherFilters();
        self.resetFilters();
    }

    redownloadAll() {
        const self = this;
        const reqBodyArr = [];
        const failedRecords = self.records.filter(e => e.status === 'ERROR' && e.redownloadMeta && e._checked);
        if (failedRecords.length > 0) {
            failedRecords.forEach((e) => {
                const obj = {
                    remoteTxnID: e.remoteTxnId,
                    odpTxnID: e.odpTxnId
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
    }

    resetFilters() {
        const self = this;
        self.filter = {};
        self.allIConfig.filter = {};
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
        self.customFiltersApplied = false;
        self.records = [...self.catchRecords, ...self.records];
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
        self.showResetFilter = true;
        if (self.inlineFiltersApplied) {
            self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
            self.clearFilterModalRef.result.then((close) => {
                if (close) {
                    self.customFiltersApplied = true;
                    self.clearOtherFilters();
                    self.fetchDataForCustomFilter();
                }
            }, dismiss => { });
        } else {
            self.customFiltersApplied = true;
            self.fetchDataForCustomFilter();
        }
    }

    private fetchDataForCustomFilter() {
        const self = this;
        self.filter['$and'] = [];
        self.allIConfig.filter['$and'] = [];
        if (self.flowTypes['$or'].length > 0) {
            self.filter['$and'].push(self.flowTypes);
            self.allIConfig.filter['$and'].push(self.flowTypes);
        }
        self.createCustomeFilterQuery();
        self.getInteractionData();
    }

    private createCustomeFilterQuery() {
        const self = this;
        Object.keys(self.filter).forEach((key, i) => {
            const temp = self.filter[key];
            if (temp && temp.hasOwnProperty('$in') && temp['$in'].length && key !== 'flowData') {
                self.allIConfig.filter['$and'].push(Object.defineProperty({}, key,
                    { value: self.filter[key], configurable: true, enumerable: true, writable: true }));
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
            self.allIConfig.filter['$and']
                .push(Object.defineProperty(
                    {},
                    'createTimestamp',
                    { value: { $lte: self.endDate }, configurable: true, enumerable: true, writable: true }));
        }
        if (self.startDate) {
            self.allIConfig.filter['$and']
                .push(Object.defineProperty(
                    {},
                    'createTimestamp',
                    { value: { $gte: self.startDate }, configurable: true, enumerable: true, writable: true }));
        }
    }

    clearOtherFilters() {
        const self = this;
        self.allIConfig.page = 1;
        self.allIConfig.count = 30;
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
        if (self.unknownCheckbox && self.unknownCheckbox.nativeElement && self.unknownCheckbox.nativeElement.checked) {
            if (!self.filter.status) {
                self.filter.status = {};
            }
            if (!self.filter.status['$in']) {
                self.filter.status['$in'] = [];
            }
            const index = self.filter.status['$in'].findIndex(e => e === 'UNKNOWN');
            if (index === -1) {
                self.filter.status['$in'].push('UNKNOWN');
            }
        } else {
            if (self.filter.status && self.filter.status['$in']) {
                const index = self.filter.status['$in'].findIndex(e => e === 'UNKNOWN');
                if (index > -1) {
                    self.filter.status['$in'].splice(index, 1);
                }
            }
        }
        if (self.queuedCheckbox && self.queuedCheckbox.nativeElement && self.queuedCheckbox.nativeElement.checked) {
            if (!self.filter.status) {
                self.filter.status = {};
            }
            if (!self.filter.status['$in']) {
                self.filter.status['$in'] = [];
            }
            const index = self.filter.status['$in'].findIndex(e => e === 'QUEUED');
            if (index === -1) {
                self.filter.status['$in'].push('QUEUED');
            }
        } else {
            if (self.filter.status && self.filter.status['$in']) {
                const index = self.filter.status['$in'].findIndex(e => e === 'QUEUED');
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

    liveFeed() {
        const self = this;
        self.toggleLiveFeed = !self.toggleLiveFeed;
        if (self.toggleLiveFeed) {
            self.getAndPushLiveInteractions();
        } else {
            self.liveFeedTxt = 'Live Feed off';
            self.subscriptions.updated.unsubscribe();
            self.subscriptions.created.unsubscribe();
            self.commonService.disconnectSocket();
        }
    }

    private getAndPushLiveInteractions() {
        const self = this;
        self.getInteractionData();
        self.liveFeedTxt = 'Live Feed on';
        self.commonService.connectSocket();
        self.subscriptions.created = self.commonService.interaction.new.subscribe((data) => {
            if (self.commonService.app._id === data.app) {
                data.message['newRcrd'] = true;
                const insertToCatch = self.insertToCatchArr(data, 'created');
                if (insertToCatch) {
                    self.catchRecords.push(data.message);
                } else {
                    self.records.unshift(data.message);
                }
            }
        });
        self.pushUpdatedInteractionRcrd();
    }

    private pushUpdatedInteractionRcrd() {
        const self = this;
        self.subscriptions.updated = self.commonService.interaction.update.subscribe((data) => {
            if (self.commonService.app._id === data.app) {
                const insertToCatch = self.insertToCatchArr(data);
                if (insertToCatch) {
                    let catchRowNodeIdx = self.catchRecords.findIndex(e => e._id === data._id);
                    if (catchRowNodeIdx !== -1) {
                        self.catchRecords[catchRowNodeIdx].status = data.message.status;
                        setTimeout(() => {
                            catchRowNodeIdx = self.catchRecords.findIndex(e => e._id === data._id);
                            delete self.catchRecords[catchRowNodeIdx].newRcrd;
                        }, 3000);
                    }
                } else {
                    let rowNodeIdx = self.records.findIndex(e => e._id === data._id);
                    if (rowNodeIdx !== -1) {
                        self.records[rowNodeIdx].status = data.message.status;
                        setTimeout(() => {
                            rowNodeIdx = self.records.findIndex(e => e._id === data._id);
                            delete self.records[rowNodeIdx].newRcrd;
                        }, 3000);
                    }
                }
            }
        });
    }

    insertToCatchArr(data, eventType?) {
        const self = this;
        let insertToCatch = false;
        if (!self.allIConfig.filter['$and']) {
            self.allIConfig.filter['$and'] = [];
        }
        self.allIConfig.filter['$and'].forEach((filter) => {
            insertToCatch = self.canBeInsertedToCatch(filter, data, insertToCatch, eventType);
        });
        return insertToCatch;
    }

    private canBeInsertedToCatch(filter, data, insertToCatch: boolean, eventType) {
        const self = this;
        if (filter.direction && filter.direction['$in'][0] !== data.message.direction) {
            insertToCatch = true;
        } else if (filter.partnerId && filter.partnerId['$in'].length > 0) {
            filter.partnerId['$in'].forEach(prtnr => {
                if (prtnr !== data.message.partnerId) {
                    insertToCatch = true;
                }
            });
        } else if (filter.status && filter.status['$in'].length > 0) {
            if (eventType && eventType === 'created') { // If custom filter contains pending
                const pendingIndex = filter.status['$in'].findIndex(e => e === 'PENDING');
                // insertToCatch = pendingIndex === -1;
                insertToCatch = pendingIndex <= -1;
            } else {
                const matchingStatusIndex = filter.status['$in'].findIndex(e => e === data.message.status);
                const indexInRcrds = self.records.findIndex(e => e._id === data._id);
                self.records.splice(indexInRcrds, 1);
                insertToCatch = matchingStatusIndex === -1;
            }
        }
        return insertToCatch;
    }

    viewInteraction(colData) {
        const self = this;
        self.appService.remoteTxnId = colData.remoteTxnId;
        self.interactionService.fromAllInteractions = true;
        self.router.navigate([`~/interactions/${self.appService.partnerId}/${colData.flowId}/${colData.odpTxnId}`]);
    }

    get hasFilters() {
        const self = this;
        return self.allIConfig && self.allIConfig.filter['$and'] && self.allIConfig.filter['$and'].length > 0;
    }

    clearInlineFilter() {
        const self = this;
        self.allIConfig.page = 1;
        self.allIConfig.count = 30;
        self.allIConfig.filter = {};
        self.appService.clearInteractionFilterEvent.emit(true);
        self.getInteractionData();
    }

    filterChange(event) {
        const self = this;
        if (self.customFiltersApplied) {
            self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
            self.clearFilterModalRef.result.then((close) => {
                if (close) {
                    // self.appService.interactionFloatingFilter = event;
                    self.resetFilters();
                    self.toggleFilter = false;
                    self.filterModel = event;
                    self.allIConfig.page = 1;
                    self.allIConfig.count = 30;
                    self.allIConfig.filter = {
                        $and: []
                    };
                    const eventKeys = Object.keys(event);
                    self.queryInteractionsI(eventKeys, event);
                }
            }, dismiss => { });
        } else {
            self.queryInteractionsII(event);
        }
    }

    private createInlineFilterQuery(eventKeys, event) {
        const self = this;
        eventKeys.forEach((key) => {
            if (event[key] && Object.keys(event[key]).length > 0) {
                if (event[key].type !== 'Time') {
                    const obj = Object.defineProperty({}, key,
                        { value: `/${event[key].value}/`, enumerable: true, writable: true });
                    self.allIConfig.filter['$and'].push(obj);
                } else if (event[key].type === 'Time' && event[key].value) {
                    const val1 = new Date(event[key].value);
                    const val2 = new Date(event[key].value);
                    val2.setDate(val1.getDate() + 1);
                    const obj1 = Object.defineProperty({}, key,
                        { value: { $gt: val1.toISOString() }, enumerable: true, writable: true });
                    const obj2 = Object.defineProperty({}, key,
                        { value: { $lt: val2.toISOString() }, enumerable: true, writable: true });
                    self.allIConfig.filter['$and'].push(obj1);
                    self.allIConfig.filter['$and'].push(obj2);
                }
            } else {
                if (self.allIConfig.filter['$and']) {
                    const i = self.allIConfig.filter['$and'].findIndex(e => e === key);
                    if (i !== -1) {
                        self.allIConfig.filter['$and'][i].splice(i, 1);
                    }
                }
            }
        });
    }

    private queryInteractionsI(eventKeys, event) {
        const self = this;
        if (eventKeys && eventKeys.length > 0) {
            self.createInlineFilterQuery(eventKeys, event);
        }
        if (self.allIConfig.filter['$and'] && self.allIConfig.filter['$and'].length === 0) {
            delete self.allIConfig.filter['$and'];
        }
        self.getInteractionData();
        self.inlineFiltersApplied = true;
    }

    private queryInteractionsII(event) {
        const self = this;
        self.filterModel = event;
        self.allIConfig.page = 1;
        self.allIConfig.count = 30;
        self.allIConfig.filter = {
            $and: []
        };
        const eventKeys = Object.keys(event);
        if (eventKeys && eventKeys.length > 0) {
            self.createInlineFilterQuery(eventKeys, event);
            self.inlineFiltersApplied = true;
        } else {
            self.inlineFiltersApplied = false;
        }
        self.getInteractionData();
    }

    sortModelChange(event) {
        const self = this;
        self.allIConfig.sort = self.getSortQuery(event);
        self.allIConfig.page = 1;
        self.getInteractionData();
    }

    getSortQuery(model: any): string {
        return Object.keys(model).map(key => model[key] === 'desc' ? '-' + key : key).join(',');
    }

    get dummyRows() {
        const self = this;
        const arr = new Array(12);
        arr.fill(1);
        return arr;
    }

    ngOnDestroy() {
        const self = this;
        if (self.clearFilterModalRef) {
            self.clearFilterModalRef.close();
        }
        if (self.redownloadModalRef) {
            self.redownloadModalRef.close();
        }
        Object.keys(self.subscriptions).forEach(key => {
            if (self.subscriptions[key]) {
                self.subscriptions[key].unsubscribe();
            }
        });
    }
}
