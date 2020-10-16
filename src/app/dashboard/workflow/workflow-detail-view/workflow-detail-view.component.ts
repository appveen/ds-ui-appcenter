import {
  Component, OnInit, Input, Renderer2, ViewChild,
  ElementRef, Output, EventEmitter, OnDestroy, TemplateRef, AfterViewInit
} from '@angular/core';
import { CommonService } from 'src/app/service/common.service';
import * as _ from 'lodash';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/service/app.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { WorkflowService } from 'src/app/dashboard/workflow/workflow.service';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { FormService } from 'src/app/service/form.service';
@Component({
  selector: 'odp-workflow-detail-view',
  templateUrl: './workflow-detail-view.component.html',
  styleUrls: ['./workflow-detail-view.component.scss'],
  animations: [trigger('cardAction', [
    state('expand', style({
      'min-height': '450px'
    })), state('collapse', style({
      height: '0px'
    })),
    state('repondBodyClose', style({
      height: '0px'
    })),
    state('repondBodyOpen', style({
      // 'height': '350px'
    })),

    transition('* => *', animate('1s'))
  ])]
})
export class WorkflowDetailViewComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('allStepsDropdown', { static: false }) allStepsDropdown: ElementRef;
  @ViewChild('confirmDiscardModal', { static: false }) confirmDiscardModal: TemplateRef<HTMLElement>;
  @ViewChild('confirmCancelModal', { static: false }) confirmCancelModal: TemplateRef<HTMLElement>;
  @ViewChild('discardModal', { static: false }) discardModal: TemplateRef<HTMLElement>;
  @ViewChild('workflowModal', { static: false }) workflowModal: TemplateRef<HTMLElement>;
  @ViewChild('workflowModalDelete', { static: false }) workflowModalDelete: TemplateRef<HTMLElement>;
  @ViewChild('inputBox', { static: false }) ele: ElementRef;
  @Input() selectedData: any;
  @Input() showWorkflowData: boolean;
  @Input() schema: any;
  @Input() definition: Array<any>;
  @Input() activeAuditOldData: any;
  @Input() activeAuditNewData: any;
  @Output() closeWfView: EventEmitter<any>;
  @Input() value: any;
  @Input() requestedByList: Array<any>;
  form: FormGroup;
  workflowModalDeleteRef: NgbModalRef;
  confirmDiscardModalRef: NgbModalRef;
  confirmCancelModalRef: NgbModalRef;
  discardModalRef: NgbModalRef;
  wizard: Array<any>;
  workflowModalRef: NgbModalRef;
  approversList: Array<any>;
  subscriptions: any;
  respondModalOptions: any;
  showAudit: boolean;
  actionArray: any = {};
  active: any;
  currentStep: number;
  respondAnimation;
  showRespondView: boolean;
  ids: Array<string>;
  showHeaderOnly: boolean;
  showLazyLoader: boolean;
  showLazyLoaderPage: boolean;
  workflowUploadedFiles: Array<any>;
  workflowModalOptions: any;
  workflowFilesList: Array<any>;
  toggleAllActionsDropDown: boolean;
  respondControl: FormControl;
  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private formService: FormService,
    private renderer: Renderer2,
    private modalService: NgbModal,
    private ts: ToastrService,
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute,
    private wfView: ElementRef,
    private wfService: WorkflowService
  ) {
    const self = this;
    self.subscriptions = {};
    self.approversList = [];
    self.respondModalOptions = {};
    self.definition = [];
    self.showAudit = false;
    self.actionArray = {
      Submit: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      SentForRework: 'Rework',
      Draft: 'Draft',
      Edit: 'Edited'
    };
    self.active = {};
    self.active[0] = true;
    self.currentStep = 0;
    self.respondAnimation = {};
    self.showRespondView = false;
    self.ids = [];
    self.showHeaderOnly = false;
    self.closeWfView = new EventEmitter();
    self.workflowUploadedFiles = [];
    self.workflowModalOptions = {};
    self.workflowFilesList = [];
  }

  ngOnInit() {
    const self = this;
    self.getApprovers();
    self.ids.push(self.selectedData._id);
    self.wizard = self.schema.wizard;
    const isEdit = self.selectedData.operation === 'PUT' ? true : false;
    const tempDef = self.formService.parseDefinition(self.schema, self.value, { isEdit });
    self.form = self.fb.group(self.formService.createForm(tempDef));
    self.respondControl = new FormControl('', Validators.required);
    // self.definition = tempDef;
  }

  ngAfterViewInit() {
    const self = this;
    const view: HTMLElement = self.wfView.nativeElement.querySelector('.view-body');
    self.renderer.listen(view, 'scroll', (event) => {
      const scrollTop = event.target.scrollTop;
      self.showHeaderOnly = scrollTop >= 26;
    });
  }
  hasPermission(method?: string) {
    const self = this;
    return self.commonService.hasPermission(self.schema._id, method);
  }

  getApprovers() {
    const self = this;
    self.subscriptions['getApprovers'] = self.commonService
      .get('user', `/approvers?entity=${self.schema._id}&app=${self.commonService.app._id}`)
      .subscribe(res => {
        self.approversList = res.approvers;
      },
        err => { });
  }

  getDefinition(field: string) {
    const self = this;
    return self.definition.find(e => e.key === field);
  }
  showStep(id) {
    const self = this;
    if (id < 0) {
      self.currentStep = 0;
      return;
    }
    if (id > self.wizard.length - 1) {
      self.currentStep = self.wizard.length - 1;
      return;
    }
    Object.keys(self.active).forEach(key => {
      self.active[key] = false;
    });
    self.active[id] = true;
    self.currentStep = id;
    document.getElementById('step-' + id).scrollIntoView();

  }
  showAllStepsDropdown(event) {
    const self = this;
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'left', (event.layerX - 200) + 'px');
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'top', (event.layerY + 25) + 'px');
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'block');
    self.allStepsDropdown.nativeElement.focus();
  }

  hideAllStepsDropdown(event) {
    const self = this;
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'none');
  }

  closeData(value?) {
    const self = this;
    if (self.form.dirty) {
      self.confirmCancelModalRef = self.modalService.open(self.confirmCancelModal, { centered: true });
      self.confirmCancelModalRef.result.then(close => {
        if (close) {
          self.closeWfView.emit(value);
          self.wfService.showActionItems = true;
          self.wfService.showFilterIcon = true;
        }
      }, dismiss => { });
    } else {
      self.closeWfView.emit(value);
      self.wfService.showActionItems = true;
      self.wfService.showFilterIcon = true;
    }
  }


  get canEditDraft() {
    const self = this;
    if (self.selectedData && (self.selectedData.status === 'Draft' || self.selectedData.status === 'Rework') && self.hasPermission('PUT')) {
      return true;
    }
    return false;
  }
  get canResubmit() {
    const self = this;
    if (self.selectedData
      && (self.hasPermission('POST') || self.hasPermission('PUT'))
      && self.selectedData.status === 'Rejected'
      && (self.selectedData.operation === 'POST' || self.selectedData.canResubmit)) {
      return true;
    }
    return false;
  }

  get canRespond() {
    const self = this;
    let flag = false;
    let audit;
    if (self.selectedData && self.selectedData.audit) {
      audit = self.selectedData.audit[self.selectedData.audit.length - 1];
    }
    if (self.selectedData.requestedBy !== self.commonService.userDetails._id) {
      flag = true;
    }
    if (audit && audit.id !== self.commonService.userDetails._id && audit.action !== 'Error') {
      flag = true;
    }
    if (self.selectedData.status !== 'Pending') {
      flag = false;
    }
    if (!self.approversList.find(e => e === self.commonService.userDetails._id)) {
      flag = false;
    }

    if (self.schema.status !== 'Active') {
      flag = false;
    }
    return flag;
  }
  get auditLength() {
    const self = this;
    let tempData = [];
    if (self.selectedData && self.selectedData.audit) {
      tempData = self.selectedData.audit.filter(e => e.action !== 'Error');
    }
    return tempData.length;
  }
  get presentAudit() {
    const self = this;
    let retVal;
    if (self.selectedData.status) {
      if (self.selectedData.status === 'Pending') {
        retVal = self.selectedData.audit.find(d => d.action === 'Submit');
      } else if (self.selectedData.status === 'Approved') {
        retVal = self.selectedData.audit.find(d => d.action === 'Approved');
      } else if (self.selectedData.status === 'Reject') {
        retVal = self.selectedData.audit.find(d => d.action === 'Reject');
      }
    }
    return retVal;
  }

  get stepFirst() {
    const self = this;
    return self.currentStep === 0;
  }
  get stepLast() {
    const self = this;
    return self.currentStep === self.wizard.length - 1;
  }
  get requiredError() {
    const self = this;
    return self.respondControl.hasError('required') && self.respondControl.touched;
  }
  ngOnDestroy() {
    const self = this;

    if (self.confirmDiscardModalRef) {
      self.confirmDiscardModalRef.close();
    }
    Object.keys(self.subscriptions).forEach(key => {
      self.subscriptions[key].unsubscribe();
    });
  }
  expandWflist() {
    const self = this;
    self.respondAnimation['card'] = !self.respondAnimation['card'];
  }

  discardDraft() {
    const self = this;
    self.workflowModalOptions._id = self.value._id;
    self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
    if (self.commonService.userDetails.basicDetails.name) {
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
    }
    self.discardModalRef = self.modalService.open(self.discardModal, { centered: true });
    self.discardModalRef.result.then(close => {
      if (close) {

        self.respondModalOptions.remarks = self.respondControl.value;

        self.respond('Discard');
      }
    }, dismiss => { });
  }

  closeDiscardModel() {
    const self = this;
    self.respondControl.markAllAsTouched();
    if (self.respondControl.invalid) {
      self.ele.nativeElement.focus();
      return;
    }

    self.discardModalRef.close(true)

  }

  respond(action: string, data?) {
    const self = this;
    this.showLazyLoader = true;
    const payload = {
      action,
      remarks: self.respondModalOptions.remarks,
      attachments: self.workflowUploadedFiles,
      ids: self.ids,
      data: data
    };
    // const ids = self.valueArray.map(e=>e._id);
    self.subscriptions['respond'] = self.commonService.put('wf', '/action', payload)
      .subscribe(res => {

        if (res.passed && res.passed.length > 0) {
          const tempData = res.passed.find(e => e._id === self.selectedData._id);
          if (tempData.status === 'Approved') {
            self.ts.success('Approved');
            self.appService.workflowStatus.emit(true);
          } else if (tempData.status === 'Rejected') {
            self.ts.error('Rejected');
            self.appService.workflowStatus.emit(true);
          }
        } else if (res.message === 'Sent For Changes.') {
          self.ts.success('Sent for rework.');
          self.appService.workflowStatus.emit(true);
        } else if (res.message === 'Submission Successful.') {
          self.ts.success('Draft Submitted');
        }
        self.closeWfView.emit({
          canCloseView: false,
          refereshRequired: true
        });

        self.showLazyLoader = false;
      }, err => {
        this.showLazyLoader = false;
        self.commonService.errorToast(err, 'Unable to respond to workflow, please try again later');
      });
  }

  editDraft() {
    const self = this;
    self.appService.draftData = self.selectedData;
    self.appService.loadPage.emit('services');
    self.router.navigate(['/~/services', self.selectedData.serviceId, 'manage'], { relativeTo: self.route });
  }

  saveDraft(reset?) {
    const self = this;
    self.simulatePayload().then(data => {
      self.form.patchValue(data);
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
      if (self.commonService.userDetails.basicDetails.name) {
        self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
      }
      self.workflowModalOptions.remarks = null;
      self.workflowUploadedFiles = [];
      self.workflowModalOptions._id = self.value._id;
      self.workflowModalOptions.operation = self.value._id ? 'PUT' : 'POST';
      self.workflowModalOptions.title = 'Save Draft';
      self.workflowModalOptions.fields = self.appService
        .countChangedFields(self.value, self.form.getRawValue()) + ' fields';
      self.workflowModalRef = self.modalService.open(self.workflowModal, { centered: true });
      self.workflowModalRef.result.then(close => {
        if (close) {
          const payload = {
            remarks: self.respondModalOptions.remarks,
            attachments: self.workflowUploadedFiles,
            data: self.form.getRawValue()
          };
          self.showLazyLoader = true;
          self.subscriptions['saveDraft'] = self.commonService.put('wf', '/doc/' + self.selectedData._id, payload)
            .subscribe(res => {
              self.showLazyLoader = false;
              self.closeWfView.emit({
                canCloseView: false,
                refereshRequired: true
              });
              self.ts.success('Draft saved.');
            }, err => {
              self.showLazyLoader = false;
              self.commonService.errorToast(err, 'Unable to save the draft, please try again later');
            });
        } else {
          self.showLazyLoader = false;
        }
      }, dismiss => {
        self.showLazyLoader = false;
      });
    }).catch(err => {
      self.showLazyLoader = false;
      self.commonService.errorToast(err, 'Validation Failed');
    });
  }

  submitDraft() {
    const self = this;
    self.showLazyLoader = true;
    self.simulatePayload().then(data => {
      self.value = data;
      self.form.patchValue(data);
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
      if (self.commonService.userDetails.basicDetails.name) {
        self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
      }
      self.workflowModalOptions._id = self.selectedData._id;
      self.workflowModalOptions.operation = self.selectedData.operation;
      if (self.selectedData.operation === 'PUT') {
        self.workflowModalOptions.title = 'Submit Draft';
        self.workflowModalOptions.fields = self.appService.countChangedFields(self.value, self.value) + ' fields';
      } else {
        self.workflowModalOptions.title = 'Submit Draft';
        self.workflowModalOptions.fields = 'New document';
      }
      if (!self.workflowModalRef) {
        self.workflowModalRef = self.modalService.open(self.workflowModal, { centered: true });
      }
      self.workflowModalRef.result.then(close => {
        if (close) {
          self.respond('Submit', self.form.getRawValue());
        } else {
          self.showLazyLoader = false;
          self.workflowModalRef = null;
        }
      }, dismiss => {
        self.showLazyLoader = false;
        self.workflowModalRef = null;
      });
    }).catch(err => {
      self.showLazyLoader = false;
      self.commonService.errorToast(err, 'Validation Failed');
    });
  }
  simulatePayload() {
    const self = this;
    let payload = self.appService.cloneObject(self.value);
    if (self.canEditDraft) {
      payload = self.form.getRawValue();
      self.appService.cleanPayload(payload, self.definition, false);
    }
    const operation = self.selectedData.operation;
    const apiPath = self.appService.serviceAPI + '/utils/simulate?operation=' + operation + '&source=Draft Submitted';
    return new Promise((resolve, reject) => {
      self.commonService.post('api', apiPath, payload).subscribe(res => {
        self.appService.fixArrayInPayload(res, self.definition, false);
        resolve(res);
      }, err => {
        reject(err);
      });
    });
  }
  uploadWorkflowFile(ev) {
    const self = this;
    const file = ev.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);
    const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
    if (indexOfValue < 0) {
      self.showLazyLoaderPage = true;
      self.subscriptions['uploadFile_' + file.name] = self.commonService.upload('wf', '', formData, false)
        .subscribe(event => {
          if (event.type === HttpEventType.UploadProgress) {
            // self.processing.progress = Math.floor(event.loaded / event.total * 100);
          }
          if (event.type === HttpEventType.Response) {
            self.showLazyLoaderPage = false;

            // self.processing.progressBar = false;
            if (self.workflowFilesList.length === 0) {
              self.workflowFilesList.push(file);
            } else {
              const indexValue = self.workflowFilesList.findIndex(val => val.name === file.name);
              if (indexValue < 0) {
                self.workflowFilesList.push(file);
              }
            }
            self.workflowUploadedFiles.push(event.body);
          }
        }, err => {
          self.showLazyLoaderPage = false;
          self.commonService.errorToast(err, 'Unable to upload the file, please try again later.');
        });
    }
  }
  actionResponse(value) {
    const self = this;
    self.showHeaderOnly = true;
    self.showRespondView = false;
    if (value && value.canCloseView) {
      self.closeData(value);
    }
  }

  resubmit() {
    const self = this;
    self.appService.reSubmitData = self.selectedData.data.new;
    if (self.selectedData.operation === 'PUT') {
      self.appService.loadPage.emit('services');
      self.router.navigate(['/~/services', self.selectedData.serviceId, 'manage',
        self.selectedData.documentId], { relativeTo: self.route });
    } else if (self.selectedData.operation === 'DELETE') {
      self.workflowModalDeleteRef = self.modalService.open(self.workflowModalDelete, { centered: true });
      self.workflowModalDeleteRef.result.then(close => {
        if (close) {
          self.deleteRequest();
        }
      }, dismiss => { });
    } else {
      self.appService.loadPage.emit('services');
      self.router.navigate(['/~/services', self.selectedData.serviceId, 'manage'], { relativeTo: self.route });
    }
  }
  deleteRequest() {
    const self = this;
    const api = '/' + self.commonService.app._id + self.schema.api;
    self.subscriptions['delete'] = self.commonService.delete('api', api + '/' + self.selectedData.documentId).subscribe(res => {
      if (res._workflow) {
        const workflowData = self.appService.cloneObject(res._workflow[0]);
        self.submitWorkflowFiles(workflowData);
      }
    }, err => {
      self.commonService.errorToast(err, 'Oops, something went wrong.');
    });
  }
  submitWorkflowFiles(workflowData) {
    const self = this;
    const payload = {
      audit: [
        {
          by: 'user',
          id: this.commonService.userDetails._id,
          action: 'Submit',
          remarks: self.workflowModalOptions.remarks,
          timestamp: Date.now(),
          attachments: self.workflowUploadedFiles
        }
      ]
    };
    self.subscriptions['updateWorkflow'] = self.commonService.put('wf', '/' + workflowData._id, payload).subscribe(res => {
      self.ts.success('Sent for review.');
    }, err => {
      self.commonService.errorToast(err, 'Oops, something went wrong.');
    });
  }
  removeWorkflowFile(index: number) {
    const self = this;
    self.workflowUploadedFiles.splice(index, 1);
    self.workflowFilesList.splice(index, 1);
  }

  triggerHook(hook: any) {
    const self = this;
    const api = '/' + self.commonService.app._id + self.schema.api;
    self.showLazyLoader = true;
    self.subscriptions['experience-hook'] = self.commonService
      .post('api', api + `/experienceHook?name=${hook.name}`, { data: self.form.getRawValue() }).subscribe(res => {
        self.showLazyLoader = false;
        if (res.data && typeof (res.data) === 'object') {
          let tempValue = self.appService.cloneObject(self.form.getRawValue());
          if (!res.data._id) {
            res.data._id = tempValue._id;
          }
          const oldValDef = self.formService.parseDefinition(self.schema, tempValue, { isEdit: true });

          tempValue = self.createData(tempValue, res.data, oldValDef);
          const tempDef = self.formService.parseDefinition(self.schema, tempValue, { isEdit: true });
          self.form = self.fb.group(self.formService.createForm(tempDef));
          self.form.markAsDirty();
        }
        if (res.message) {
          self.ts.success(res.message);
        }
      }, err => {
        self.showLazyLoader = false;
        self.commonService.errorToast(err, 'Unable no trigger the hook, please try again later');
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

  addPlaceholderFormCntrls(def, resData) {
    const self = this;
    def.forEach((attribute) => {
      if (attribute.type === 'Array') {
        const collectionType = attribute.definition[0].type;
        const controlName = attribute.path;
        if (collectionType === 'Object') {
          const temp = self.appService.getValue(attribute.key, resData);
          (self.form.get(controlName) as FormArray).controls.splice(0);
          if (temp) {
            for (let i = 0; i < temp.length; i++) {
              const datum = self.formService.createForm(attribute.definition[0].definition);
              (self.form.get(controlName) as FormArray).push(self.fb.group(datum));
            }
          }
        } else if (collectionType === 'Array') {
          self.addPlaceholderFormCntrls(attribute.definition[0].definition, resData);
        }
      }
    });
  }

  get isScrollExist() {
    const ele = document.getElementById('workflowData');
    if (ele.clientWidth === ele.scrollWidth) {
      return false;
    } else {
      return true;

    }
  }
}


