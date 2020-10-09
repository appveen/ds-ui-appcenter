import { Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { environment } from 'src/environments/environment';
import { FormService } from 'src/app/service/form.service';


@Component({
    selector: 'odp-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {

    @ViewChild('confirmDeleteModal', { static: false }) confirmDeleteModal: TemplateRef<HTMLElement>;
    @ViewChild('confirmPatchModal', { static: false }) confirmPatchModal: TemplateRef<HTMLElement>;
    @ViewChild('workflowModal', { static: false }) workflowModal: TemplateRef<HTMLElement>;
    @ViewChild('allStepsDropdown', { static: false }) allStepsDropdown: ElementRef;
    @ViewChild('reviewActionBox', { static: false }) reviewActionBox: ElementRef;
    @ViewChild('filters', { static: false }) filters: ElementRef;
    @ViewChild('modalProperty', { static: false }) modalProperty: ElementRef;
    confirmDeleteModalRef: NgbModalRef;
    confirmPatchModalRef: NgbModalRef;
    workflowModalRef: NgbModalRef;
    id: string;
    api: string;
    schema: any = {};
    value: any = {};
    active: any = {};
    currentStep: number;
    definition: Array<any>;
    wizard: any = [];
    dataVersionShow: boolean;
    activeAuditOldData: any;
    activeAuditNewData: any;
    showLazyLoader: boolean;
    subscriptions: any = {};
    showHistoryDropdown: boolean;
    documentLocked: boolean;
    canReview: boolean;
    hasWorkflow: boolean;
    workflowModalOptions: any;
    workflowData: any;
    workflowUploadedFiles: Array<any>;
    workflowFilesList: Array<any>;
    inReview: boolean;
    showBlackOutModal: boolean;
    actionArray: any = {};
    remarksData: any = {};
    approversList: Array<any>;
    toggleAllActionsDropDown: boolean;
    showHeaderOnly: boolean;
    showRespondView: boolean;
    respondControl: FormControl;
    showVersionHistory: boolean;
    showVersionHistoryWF: boolean;
    auditAvailable: boolean;
    selectedAudit: any;
    constructor(
        private renderer: Renderer2,
        private appService: AppService,
        private router: Router,
        private route: ActivatedRoute,
        private commonService: CommonService,
        private ts: ToastrService,
        private modalService: NgbModal,
        private ngbToolTipConfig: NgbTooltipConfig,
        private formService: FormService,
    ) {
        const self = this;
        self.workflowModalOptions = {};
        self.workflowUploadedFiles = [];
        self.workflowFilesList = [];
        self.definition = [];
        self.approversList = [];
        self.showBlackOutModal = false;
        self.actionArray = {
            Submit: 'Submited',
            Approved: 'Approved',
            Rejected: 'Rejected',
            SentForRework: 'Rework',
            Draft: 'Draft'
        };
        self.approversList = [];
        self.respondControl = new FormControl('', Validators.required);

    }

    ngOnInit() {
        const self = this;
        self.ngbToolTipConfig.container = 'body';
        self.showLazyLoader = true;
        self.subscriptions['routeParams'] = self.route.params.subscribe(
            params => {
                if (params.recordId) {
                    self.dataVersionShow = false;
                    self.activeAuditOldData = null;
                    self.activeAuditNewData = null;
                    self.getSchema(self.appService.serviceId, params.recordId);
                } else {
                    self.router.navigate(['/~']);
                }
            }
        );
        self.subscriptions['appChange'] = self.appService.appChange.subscribe(app => {
            self.router.navigate(['/~']);
        });
    }

    ngOnDestroy() {
        const self = this;
        if (self.confirmDeleteModalRef) {
            self.confirmDeleteModalRef.close();
        }
        if (self.confirmPatchModalRef) {
            self.confirmPatchModalRef.close();
        }
        if (self.workflowModalRef) {
            self.workflowModalRef.close();
        }
        Object.keys(self.subscriptions).forEach(key => {
            if (self.subscriptions[key]) {
                self.subscriptions[key].unsubscribe();
            }
        });
    }

    updateSchema(parsedDef) {
        Object.keys(parsedDef).forEach(key => {
            if (parsedDef[key].properties && parsedDef[key].properties.relatedTo) {
                parsedDef[key].type = 'Relation';
                parsedDef[key].properties._typeChanged = 'Relation';
                delete parsedDef[key].definition;
            } else if (parsedDef[key].type === 'Array') {
                this.updateSchema(parsedDef[key].definition);
            } else if (parsedDef[key].type === 'Object') {
                this.updateSchema(parsedDef[key].definition);
            }
        });
    }

    getSchema(id, recordId) {
        const self = this;
        self.id = recordId;
        self.subscriptions['getSchema'] = self.commonService.get('sm', '/service/' + id).subscribe(res => {
            const parsedDef = JSON.parse(res.definition);
            self.updateSchema(parsedDef);
            self.formService.patchType(parsedDef);
            res.definition = JSON.stringify(parsedDef);
            self.schema = res;
            if (res.wizard && res.wizard.length > 0) {
                self.active[0] = true;
                self.wizard = res.wizard;
                self.currentStep = 0;
            }
            if (res && res.approvers && res.approvers.length > 0) {
                self.active[0] = true;
            }
            self.api = '/' + self.commonService.app._id + res.api;
            self.appService.serviceAPI = self.api;
            self.getApprovers();
            self.getPermissions(JSON.parse(res.definition));
        }, err => {
            self.showLazyLoader = false;
            if (err.status === 403) {
                self.router.navigate(['/~/no-access']);
            } else if (err.status === 404) {
                self.router.navigate(['/~']);
            } else {
                self.commonService.errorToast(err, 'Unable to get service record, please try again later');
            }
        });
    }

    getApprovers() {
        const self = this;
        self.subscriptions['getApprovers'] = self.commonService
            .get('user', `/approvers?entity=${self.schema._id}&app=${self.commonService.app._id}`)
            .subscribe(res => {
                if (res && res.approvers && res.approvers.length > 0) {
                    self.approversList = res.approvers;
                    self.hasWorkflow = true;
                }
            }, err => {

            });
    }

    showStep(val) {
        const self = this;
        if (val < 0) {
            self.currentStep = 0;
            return;
        }
        if (val > self.wizard.length - 1) {
            self.currentStep = self.wizard.length - 1;
            return;
        }
        Object.keys(self.active).forEach(key => {
            self.active[key] = false;
        });
        self.active[val] = true;
        self.currentStep = val;
        document.getElementById('step-' + val).scrollIntoView();
    }

    showAllStepsDropdown(event) {
        const self = this;
        self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'block');
        self.allStepsDropdown.nativeElement.focus();
    }

    hideAllStepsDropdown(event) {
        const self = this;
        self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'none');
    }

    getPermissions(definition) {
        const self = this;
        if (!self.hasPermission()) {
            self.router.navigate(['/~/services', self.schema._id, 'list'], { relativeTo: self.route });
            return;
        }
        if (!self.hasPermission('POST') && !self.hasPermission('PUT') && !self.hasPermission('DELETE')) {
            const fields = self.commonService.getViewFields(self.schema._id);
            self.appService.configureByPermission(definition, fields);
        }
        definition._id = { type: 'String', properties: definition._id.properties };
        self.schema.definition = JSON.stringify(definition);
        self.isDocumentLocked();
        self.subscriptions['getRecord'] = self.commonService.get('api', self.api + '/' + self.id + '?expand=true').subscribe(data => {
            self.showLazyLoader = false;
            self.value = data;
            self.definition = self.formService.parseDefinition(self.schema, data, false);
            if (self.schema.wizard && self.schema.wizard.length > 0) {
                self.active[0] = true;
                self.wizard = self.schema.wizard;
                self.currentStep = 0;
            }
        }, err => {
            self.showLazyLoader = false;
            if (err.status === 403) {
                self.router.navigate(['/~/no-access']);
            } else {
                self.commonService.errorToast(err, 'Oops, something went wrong.');
            }
        });
    }

    getDefinition(field: string) {
        const self = this;
        return self.definition.find(e => e.key === field);
    }

    compareVersion() {
        const self = this;
        self.activeAuditOldData = self.selectedAudit.data.old;
        self.activeAuditNewData = self.selectedAudit.data.new;
    }

    clearVersion() {
        const self = this;
        self.showHistoryDropdown = false;
        self.activeAuditOldData = null;
        self.activeAuditNewData = null;
    }

    getKeys(obj) {
        return Object.keys(obj);
    }

    workflowAlert() {
        const self = this;
        if (self.hasWorkflow) {
            self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
            if (self.commonService.userDetails.basicDetails.name) {
                self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
            }
            self.workflowModalOptions._id = self.id;
            self.workflowModalOptions.operation = 'DELETE';
            self.workflowModalOptions.fields = 'Delete document';
            self.workflowModalRef = self.modalService.open(self.workflowModal, { centered: true });
            self.workflowModalRef.result.then(close => {
                if (close) {
                    self.deleteAlert();
                }
            }, dismiss => { });
        } else {
            self.deleteAlert();
        }
    }

    closeModal() {
        const self = this;
        if (self.respondControl.invalid) {
            self.respondControl.markAllAsTouched();
            return;
        } else {
            self.workflowModalRef.close(true);
        }
    }


    deleteAlert() {
        const self = this;
        if (self.hasWorkflow) {
            self.deleteRequest();
        } else {
            self.confirmDeleteModalRef = self.modalService.open(self.confirmDeleteModal);
            self.confirmDeleteModalRef.result.then(close => {
                if (close) {
                    self.deleteRequest();
                }
            }, dismiss => { });
        }
    }

    deleteRequest() {
        const self = this;
        self.subscriptions['delete'] = self.commonService.delete('api', self.api + '/' + self.id).subscribe(res => {
            if (res._workflow) {
                self.workflowData = self.appService.cloneObject(res._workflow[0]);
                self.submitWorkflowFiles();
            } else {
                self.ts.success('Deleted.');
                self.router.navigate(['/~/services', self.schema._id, 'list'], { relativeTo: self.route });
            }
        }, err => {
            self.commonService.errorToast(err, 'Unable to delete the record, please try again later');
        });
    }

    manage(id) {
        const self = this;
        self.appService.prevUrl = this.route['_routerState']['snapshot']['url'];
        self.router.navigate(['/~/services', self.schema._id, 'manage', id]);
    }

    hasPermission(method?: string): boolean {
        const self = this;
        return self.commonService.hasPermission(self.schema._id, method);
    }

    isDocumentLocked() {
        const self = this;
        const options = {
            filter: {
                documentId: self.id,
                serviceId: self.appService.serviceId,
                app: self.commonService.app._id,
                status: {
                    '$in': ['Pending', 'Rework', 'Draft']
                }
            }
        };
        self.subscriptions['isDocumentLocked'] = self.commonService.get('wf', '', options).subscribe(data => {
            if (data && data.length > 0) {
                self.documentLocked = true;
                if (data[0].requestedBy !== self.commonService.userDetails._id) {
                    self.workflowData = data[0];
                    self.canReview = true;
                    self.getUserDetails();
                }
                setTimeout(() => {
                    if (self.approversList.length > 0 && !self.approversList.find(e => e === self.commonService.userDetails._id)) {
                        self.canReview = false;
                    }
                }, 300);
            }
        }, err => {
        });
    }

    uploadWorkflowFile(ev) {
        const self = this;
        const file = ev.target.files[0];
        const formData: FormData = new FormData();
        formData.append('file', file);
        if (self.workflowFilesList.length === 0) {
            self.workflowFilesList.push(file);
        } else {
            const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
            if (indexOfValue < 0) {
                self.workflowFilesList.push(file);
            }
        }
        self.subscriptions['uploadFile_' + file.name] = self.commonService.upload('wf', '', formData, false)
            .subscribe(event => {
                if (event.type === HttpEventType.UploadProgress) {
                    // self.processing.progress = Math.floor(event.loaded / event.total * 100);
                }
                if (event.type === HttpEventType.Response) {
                    // self.processing.progressBar = false;
                    self.workflowUploadedFiles.push(event.body);
                    ev.target.value = '';

                }
            });
    }

    submitWorkflowFiles() {
        const self = this;
        const payload = {
            audit: [
                {
                    by: 'user',
                    id: this.commonService.userDetails._id,
                    action: 'Submit',
                    remarks: self.respondControl.value,
                    timestamp: Date.now(),
                    attachments: self.workflowUploadedFiles
                }
            ]
        };
        self.subscriptions['updateWorkflow'] = self.commonService.put('wf', '/' + self.workflowData._id, payload).subscribe(res => {
            self.ts.success('Sent for review.');
            self.router.navigate(['/~/services', self.schema._id, 'list'], { relativeTo: self.route });
        }, err => {
        });
    }

    removeWorkflowFile(index: number) {
        const self = this;
        self.workflowUploadedFiles.splice(index, 1);
        self.workflowFilesList.splice(index, 1);
    }

    review() {
        const self = this;
        self.inReview = true;
        self.activeAuditOldData = self.workflowData.data.old;
        self.value = self.workflowData.data.new;
        self.activeAuditNewData = self.workflowData.data.new;
    }

    respond(action: string) {
        const self = this;
        const payload = {
            action,
            remarks: self.workflowModalOptions.remarks,
            attachments: self.workflowUploadedFiles,
            ids: [self.workflowData._id]
        };
        self.subscriptions['respondWorkflow'] = self.commonService
            .put('wf', '/action', payload).subscribe(res => {
                if (res.passed && res.passed.length > 0) {
                    if (res.passed[0].status === 'Approved') {
                        self.ts.success('Approved');
                    } else if (res.passed[0].status === 'Rejected') {
                        self.ts.error('Rejected');
                    }
                } else if (res.message === 'Sent For Changes.') {
                    self.ts.success('Sent for rework.');
                }
                self.router.navigate(['/~/services', self.schema._id, 'list'], { relativeTo: self.route });
            }, err => { });
    }

    scrollToRespond() {
        const self = this;
        self.showRespondView = true;
        if (self.reviewActionBox && self.reviewActionBox.nativeElement) {
            (self.reviewActionBox.nativeElement as HTMLElement).scrollIntoView();
        }
    }

    getUserDetails() {
        const self = this;
        self.commonService.getUser(self.workflowData.requestedBy).then(res => {
            const value = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
            self.workflowData.requestedByName = value;
        }).catch(err => {
            self.workflowData.requestedByName = 'User Deleted';
            self.workflowData.userDeleted = true;
        });
    }

    downloadFile(id) {
        const self = this;
        window.open(environment.url.api + self.appService.serviceAPI + '/file/download/' + id);
    }

    toggleVerHistory(event) {
        const self = this;
        event.stopPropagation();
        self.showHistoryDropdown = !self.showHistoryDropdown;
    }

    triggerHook(hook: ExpHook) {
        const self = this;
        self.commonService.post('api', self.api + `/experienceHook?name=${hook.name}`, { data: self.value }).subscribe(res => {
            if (res.data && typeof (res.data) === 'object') {
                let tempValue = self.appService.cloneObject(self.value);
                if (!res.data._id) {
                    res.data._id = tempValue._id;
                }
                const oldValDef = self.formService.parseDefinition(self.schema, tempValue, false);
                tempValue = self.createData(tempValue, res.data, oldValDef);
                self.definition = self.formService.parseDefinition(self.schema, tempValue, false);
            }
            self.showLazyLoader = false;
            if (res.message) {
                self.ts.success(res.message);
            }
            // self.value = res.data;
            // self.definition = self.formService.parseDefinition(self.schema, res.data, false);
        }, err => {
            self.commonService.errorToast(err, 'Unable to trigger the hook, Please try again later');
        });
    }

    createData(oldData, newData, def) {
        def.forEach(element => {
            if (element.type === 'Object') {
                this.createData(oldData[element.key], newData[element.key], element.definition);
            } else if (newData && newData[element.key] !== null && newData[element.key] !== undefined) {
                oldData[element.key] = newData[element.key];
            }
        });
        return oldData;

    }
    actionResponse(value) {
        const self = this;
        self.showHeaderOnly = true;
        self.showRespondView = false;
        if (value && value.canCloseView) {
            self.router.navigate(['/~/services', self.schema._id, 'list'], { relativeTo: self.route });
        }
    }

    get viewBodyClass() {
        const self = this;
        const action = self.wizard && self.wizard.length > 0 ? self.wizard[self.currentStep].actions : [];
        return {
            'no-steps': self.wizard.length === 0 && !self.showVersionHistory,
            'history-no-steps': self.wizard.length === 0 && self.showVersionHistory,
            'history-steps-action': self.wizard.length > 0 && self.showVersionHistory && action.length > 0,
            'history-steps-no-action': self.wizard.length > 0 && self.showVersionHistory && action.length === 0,
            'steps-action': self.wizard.length > 0 && !self.showVersionHistory && action.length > 0,
            'steps-no-action': self.wizard.length > 0 && !self.showVersionHistory && action.length === 0,
        };

    }

    get requiredError() {
        const self = this;
        return self.respondControl.hasError('required') && self.respondControl.touched;
    }

    get stepFirst() {
        const self = this;
        return self.currentStep === 0;
    }

    get stepLast() {
        const self = this;
        return self.currentStep === self.wizard.length - 1;
    }

    get canSendForRework() {
        const self = this;
        let flag = false;
        if (self.workflowData && self.workflowData.operation !== 'DELETE') {
            flag = true;
        }
        return flag;
    }

    get auditLength() {
        const self = this;
        let tempData = [];
        if (self.remarksData && self.remarksData.audit) {
            tempData = self.remarksData.audit.filter(e => e.action !== 'Error');
        }
        return tempData.length;
    }

    get dummyRows() {
        const arr = new Array(10);
        arr.fill(1);
        return arr;
    }

}

export interface ExpHook {
    label?: string;
    name?: string;
    type?: string;
    url?: string;
    errorMessage?: string;
}
