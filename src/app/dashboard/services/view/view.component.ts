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
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'odp-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {
    @ViewChild('confirmDeleteModal', { static: false })
    confirmDeleteModal: TemplateRef<HTMLElement>;
    @ViewChild('confirmPatchModal', { static: false })
    confirmPatchModal: TemplateRef<HTMLElement>;
    @ViewChild('workflowModal', { static: false })
    workflowModal: TemplateRef<HTMLElement>;
    @ViewChild('allStepsDropdown', { static: false })
    allStepsDropdown: ElementRef;
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
    workflowModalOptions: any;
    workflowData: any;
    workflowUploadedFiles: Array<any>;
    workflowFilesList: Array<any>;
    inReview: boolean;
    showBlackOutModal: boolean;
    actionArray: any = {};
    remarksData: any = {};
    toggleAllActionsDropDown: boolean;
    showHeaderOnly: boolean;
    showRespondView: boolean;
    respondControl: FormControl;
    showVersionHistory: boolean;
    showVersionHistoryWF: boolean;
    auditAvailable: boolean;
    selectedAudit: any;
    stateModelAttr: any;
    stateModelAttrVal: any;
    stateModelName: string;
    isSchemaFree: boolean;
    selectedEditorTheme: any;
    selectedFontSize: any;
    schemaFreeCode: any;
    viewMode: string;
    get currentAppId() {
        return this.commonService?.getCurrentAppId();
    }

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
        private shortcutService: ShortcutService
    ) {
        const self = this;
        self.workflowModalOptions = {};
        self.workflowUploadedFiles = [];
        self.workflowFilesList = [];
        self.definition = [];
        self.showBlackOutModal = false;
        self.actionArray = {
            Submit: 'Submited',
            Approved: 'Approved',
            Rejected: 'Rejected',
            SentForRework: 'Rework',
            Draft: 'Draft'
        };
        self.respondControl = new FormControl('', Validators.required);
        self.stateModelName = '';
        self.isSchemaFree = null;
        this.selectedEditorTheme = 'vs-light';
        this.selectedFontSize = 14;
        this.viewMode = 'code';
    }

    ngOnInit() {
        const self = this;
        self.ngbToolTipConfig.container = 'body';
        self.showLazyLoader = true;
        self.subscriptions['routeParams'] = self.route.params.subscribe(params => {
            if (params.recordId) {
                self.dataVersionShow = false;
                self.activeAuditOldData = null;
                self.activeAuditNewData = null;
                self.getSchema(self.appService.serviceId, params.recordId);
            } else {
                self.router.navigate(['/', this.commonService.app._id,]);
            }
        });
        self.subscriptions['appChange'] = self.appService.appChange.subscribe(app => {
            self.router.navigate(['/', this.commonService.app._id,]);
        });
        this.setupShortcuts();
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

    setupShortcuts() {
        const self = this;
        this.shortcutService.unregisterAllShortcuts(357);
        this.shortcutService.registerShortcut({
            section: 'Table',
            label: 'Close Record',
            keys: ['Esc']
        });
        self.subscriptions['closeRecord'] = self.shortcutService.key
            .pipe(filter(event => event.key.toUpperCase() === 'ESCAPE' && !this.commonService.isFilePreviewModalOpen))
            .subscribe(() => {
                self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list']);
            });
    }

    toggleHistory() {
        const self = this;
        self.showVersionHistory = !self.showVersionHistory;
        if (self.showVersionHistory) {
            self.compareVersion();
        }
    }

    selectAudit($event) {
        const self = this;
        self.selectedAudit = $event;
        if (self.schema.schemaFree) {
            self.compareVersion();
        }
    }

    updateSchema(parsedDef) {
        parsedDef.forEach(def => {
            if (def.properties && def.properties.relatedTo) {
                def.type = 'Relation';
                def.properties._typeChanged = 'Relation';
                delete def.definition;
            } else if (def.properties && def.properties.geoType) {
                def.type = 'Geojson';
                def.properties._typeChanged = 'Geojson';
                delete def.definition;
            } else if (def.type === 'Array') {
                this.updateSchema(def.definition);
            } else if (def.type === 'Object') {
                this.updateSchema(def.definition);
            }
        });
    }

    getSchema(id, recordId) {
        const self = this;
        self.id = recordId;
        self.subscriptions['getSchema'] = self.commonService.get('sm', `/${this.commonService.app._id}/service/` + id, { filter: { app: this.commonService.app._id } }).subscribe(
            res => {
                const parsedDef = res.definition;
                self.updateSchema(parsedDef);
                //self.isSchemaFree = true;
                if (res.schemaFree) {
                    self.isSchemaFree = res.schemaFree;
                }
                self.formService.patchType(parsedDef);
                res.definition = JSON.parse(JSON.stringify(parsedDef));
                if (res.stateModel && res.stateModel.enabled == true) {
                    self.stateModelAttr = res.stateModel.attribute;
                    let stateModelDefIndex = res.definition.findIndex(data => data.key == self.stateModelAttr);
                    if (stateModelDefIndex > -1) {
                        const customLabel = res.definition[stateModelDefIndex].properties?.label;
                        self.stateModelName = customLabel ? customLabel : res.definition[stateModelDefIndex].properties.name;
                    }
                }
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
                self.getPermissions(res.definition);
            },
            err => {
                self.showLazyLoader = false;
                if (err.status === 403) {
                    self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
                        state: {
                            noRedirect: true,
                            serviceId: id
                        }
                    }
                    );
                } else if (err.status === 404) {
                    self.router.navigate(['/', this.commonService.app._id,]);
                } else {
                    self.commonService.errorToast(err, 'Unable to get service record, please try again later');
                }
            }
        );
    }

    checkStateModel(def) {
        if (this.stateModelAttr && def.key == this.stateModelAttr) {
            return true;
        }
        else return false;
    }

    get stateModelCreated() {
        const self = this;
        if (self.activeAuditNewData && self.activeAuditNewData.hasOwnProperty(self.stateModelAttr) && self.activeAuditOldData && !self.activeAuditOldData.hasOwnProperty(self.stateModelAttr)) {
            return true;
        }
        else {
            return false;
        }
    }

    get stateModelUpdated() {
        const self = this;
        if (self.activeAuditOldData && self.activeAuditOldData.hasOwnProperty(self.stateModelAttr)) {
            return true;
        }
        else {
            return false;
        }
    }

    stateModelVersionData(auditData) {
        const self = this;
        if (auditData.hasOwnProperty(self.stateModelAttr)) {
            return auditData[self.stateModelAttr];
        }
        else {
            return 'N.A'
        }
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
        // document.getElementById('step-' + val).scrollIntoView();
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
        let newDefinition = JSON.parse(JSON.stringify(definition));
        if (!self.hasPermission()) {
            self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list'], {
                relativeTo: self.route
            });
            return;
        }
        if (!self.hasPermission('POST') && !self.hasPermission('PUT') && !self.hasPermission('DELETE')) {
            // const fields = self.commonService.getViewFieldsList(self.schema._id);
            const fields = [self.schema.role]
            newDefinition = self.appService.configureByPermission(newDefinition, fields);
        }
        // newDefinition.push({
        //     key: '_id',
        //     type: 'String',
        //     properties: definition._id.properties
        // });
        self.schema.definition = newDefinition;
        self.isDocumentLocked();
        self.subscriptions['getRecord'] = self.commonService.get('api', self.api + '/' + self.id, { expand: true, decrypt: true }).subscribe(
            data => {
                self.showLazyLoader = false;
                self.value = data;
                if (self.isSchemaFree) {
                    self.schemaFreeCode = JSON.parse(JSON.stringify(data));
                    delete self.schemaFreeCode["_metadata"]
                    delete self.schemaFreeCode["__v"]
                    if (self.schemaFreeCode["_workflow"]) {
                        delete self.schemaFreeCode["_workflow"];
                    }
                }
                self.definition = self.formService.parseDefinition(self.schema, data, false);
                if (self.stateModelAttr) {
                    let stateModelDef = self.definition.find(def => def.key == self.stateModelAttr)
                    if (stateModelDef) {
                        self.stateModelAttrVal = stateModelDef.value;
                    }
                }
                if (self.schema.wizard && self.schema.wizard.length > 0) {
                    self.active[0] = true;
                    self.wizard = self.schema.wizard;
                    self.currentStep = 0;
                }
            },
            err => {
                self.showLazyLoader = false;
                if (err.status === 403) {
                    self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
                        state: {
                            noRedirect: true,
                            serviceId: self.schema._id
                        }
                    }
                    );
                } else {
                    self.commonService.errorToast(err, 'Oops, something went wrong.');
                }
            }
        );
    }

    getDefinition(field: string) {
        const self = this;
        let def = self.definition.find(e => e.key === field);
        if (self.stateModelAttr && def) {
            if (def.key != self.stateModelAttr) {
                return def;
            }
            else {
                return null;
            }
        }
        return def;
    }

    schemaFreeFormat(code) {
        let data = JSON.parse(JSON.stringify(code))
        if (!data) {
            return {}
        }
        delete data["_metadata"]
        delete data["__v"]
        if (data["_workflow"]) {
            delete data["_workflow"];
        }
        return data;
    }

    compareVersion() {
        const self = this;
        if (!self.schema.schemaFree) {
            self.activeAuditOldData = self.selectedAudit.data.old;
            self.activeAuditNewData = self.selectedAudit.data.new;
        }
        else {
            self.activeAuditOldData = self.schemaFreeFormat(self.selectedAudit.data.old);
            self.activeAuditNewData = self.schemaFreeFormat(self.selectedAudit.data.new);
        }

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
            self.workflowModalRef = self.modalService.open(self.workflowModal, {
                centered: true
            });
            self.workflowModalRef.result.then(
                close => {
                    if (close) {
                        self.deleteAlert();
                    }
                },
                dismiss => { }
            );
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
            self.confirmDeleteModalRef.result.then(
                close => {
                    if (close) {
                        self.deleteRequest();
                    }
                },
                dismiss => { }
            );
        }
    }

    deleteRequest() {
        const self = this;
        self.subscriptions['delete'] = self.commonService.delete('api', self.api + '/' + self.id).subscribe(
            res => {
                if (res._workflow) {
                    self.workflowData = { _id: res._workflow };
                    self.submitWorkflowFiles();
                } else {
                    self.ts.success('Deleted.');
                    self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list'], {
                        relativeTo: self.route
                    });
                }
            },
            err => {
                self.commonService.errorToast(err, 'Unable to delete the record, please try again later');
            }
        );
    }

    manage(id) {
        const self = this;
        self.appService.prevUrl = this.route['_routerState']['snapshot']['url'];
        self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'manage', id]);
    }

    hasPermission(method?: string): boolean {
        const self = this;
        return self.commonService.hasPermission(self.schema._id, self.schema.role?.roles, method);
    }

    isDocumentLocked() {
        const self = this;
        const options = {
            filter: {
                documentId: self.id,
                serviceId: self.appService.serviceId,
                app: self.commonService.app._id,
                status: {
                    $in: ['Pending', 'Rework', 'Draft']
                }
            }
        };
        self.subscriptions['isDocumentLocked'] = self.commonService.get('api', this.api + '/utils/workflow', options).subscribe(
            data => {
                if (data && data.length > 0) {
                    self.documentLocked = true;
                    if (data[0].requestedBy !== self.commonService.userDetails._id) {
                        self.workflowData = data[0];
                        self.canReview = true;
                        self.getUserDetails();
                    }
                    self.canReview = this.commonService.canRespondToWF(this.schema, self.workflowData.checkerStep);
                }
            },
            err => { }
        );
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
        self.subscriptions['uploadFile_' + file.name] = self.commonService
            .upload('api', this.api, formData, false).subscribe(event => {
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
        self.subscriptions['updateWorkflow'] = self.commonService
            .put('api', this.api + '/utils/workflow/' + self.workflowData._id, payload).subscribe(
                res => {
                    self.ts.success('Sent for review.');
                    self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list'], {
                        relativeTo: self.route
                    });
                },
                err => { }
            );
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
            .put('api', this.api + '/utils/workflow/action', payload).subscribe(
                res => {
                    if (res.passed && res.passed.length > 0) {
                        if (res.passed[0].status === 'Approved') {
                            self.ts.success('Approved');
                        } else if (res.passed[0].status === 'Rejected') {
                            self.ts.error('Rejected');
                        }
                    } else if (res.message === 'Sent For Changes.') {
                        self.ts.success('Sent for rework.');
                    }
                    self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list'], {
                        relativeTo: self.route
                    });
                },
                err => { }
            );
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
        self.commonService
            .getUser(self.workflowData.requestedBy)
            .then(res => {
                const value = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
                self.workflowData.requestedByName = value;
            })
            .catch(err => {
                self.workflowData.requestedByName = 'User Deleted';
                self.workflowData.userDeleted = true;
            });
    }

    downloadFile(id) {
        const self = this;
        window.open(environment.url.api + self.appService.serviceAPI + '/utils/file/download/' + id);
    }

    toggleVerHistory(event) {
        const self = this;
        event.stopPropagation();
        self.showHistoryDropdown = !self.showHistoryDropdown;
    }

    triggerHook(hook: ExpHook) {
        const self = this;
        self.commonService
            .post('api', self.api + `/utils/experienceHook?name=${hook.name}`, {
                data: self.value
            })
            .subscribe(
                res => {
                    if (res.data && typeof res.data === 'object') {
                        let tempValue = self.appService.cloneObject(self.value);
                        if (res.data._id) {
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
                },
                err => {
                    self.commonService.errorToast(err, 'Unable to trigger the hook, Please try again later');
                }
            );
    }

    createData(oldData, newData, def) {
        def.forEach(element => {
            if (element.type === 'Object') {
                if (!oldData[element.key]) {
                    oldData[element.key] = {};
                }
                this.createData(oldData[element.key], newData[element.key], element.definition);
            } else if (newData && newData.hasOwnProperty(element.key) && !element.properties?.createOnly) {
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
            self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list'], {
                relativeTo: self.route
            });
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
            'steps-no-action': self.wizard.length > 0 && !self.showVersionHistory && action.length === 0
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

    get hasWorkflow() {
        if (this.schema) {
            return this.commonService.hasWorkflow(this.schema)
        }
        return false;
    }
}

export interface ExpHook {
    label?: string;
    name?: string;
    type?: string;
    url?: string;
    errorMessage?: string;
}
