import { Component, OnInit, ViewChild, ElementRef, TemplateRef, Renderer2, OnDestroy } from '@angular/core';
import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { FormService } from 'src/app/service/form.service';
import { WorkflowService } from '../workflow.service';
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { filter } from 'rxjs/operators';
import { WorkflowRemarksViewComponent } from 'src/app/utils/workflow-remarks-view/workflow-remarks-view.component';
import { WorkflowRespondViewComponent } from 'src/app/utils/workflow-respond-view/workflow-respond-view.component';

@Component({
  selector: 'odp-workflow-manage',
  templateUrl: './workflow-manage.component.html',
  styleUrls: ['./workflow-manage.component.scss']
})
export class WorkflowManageComponent implements OnInit, OnDestroy {
  @ViewChild('allStepsDropdown', { static: false })
  allStepsDropdown: ElementRef;
  @ViewChild('confirmCancelModal', { static: false })
  confirmCancelModal: TemplateRef<HTMLElement>;
  @ViewChild('discardModal', { static: false })
  discardModal: TemplateRef<HTMLElement>;
  @ViewChild('workflowModal', { static: false })
  workflowModal: TemplateRef<HTMLElement>;
  @ViewChild('workflowModalDelete', { static: false })
  workflowModalDelete: TemplateRef<HTMLElement>;
  @ViewChild('inputBox', { static: false }) ele: ElementRef;
  form: FormGroup;
  workflowModalDeleteRef: NgbModalRef;
  confirmCancelModalRef: NgbModalRef;
  discardModalRef: NgbModalRef;
  workflowModalRef: NgbModalRef;
  subscriptions: any;
  serviceId: string;
  workflowId: string;
  serviceAPI: string;
  loading: boolean;
  schema: any;
  wizard: any;
  active: any;
  recordIdName: string;
  dataToRespond: any;
  selectedData: any;
  value: any;
  activeAuditOldData: any;
  activeAuditNewData: any;
  definition: Array<any>;
  showLazyLoader: boolean;
  currentStep = 0;
  respondControl: FormControl;
  respondModalOptions: any;
  workflowUploadedFiles: Array<any>;
  workflowModalOptions: any;
  workflowFilesList: Array<any>;
  showHeaderOnly: boolean;
  showRespondView: boolean;
  toggleAllActionsDropDown: boolean;
  ids: Array<string>;
  requestedByList: Array<any>;
  expandList: Array<any>;
  workflowApi: string;
  api: string;
  stateModelAttr: string;
  stateModelName: string;
  nextStates: any;
  initialState: any;
  stateModelPath: any;
  editMode: boolean;
  oldValue: any;
  constructor(
    private commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private ts: ToastrService,
    private formService: FormService,
    public wfService: WorkflowService,
    private wfView: ElementRef,
    private renderer: Renderer2,
    private fb: FormBuilder,
    private shortcutService: ShortcutService
  ) {
    const self = this;
    self.subscriptions = {};
    self.schema = {};
    self.selectedData = {};
    self.wizard = [];
    self.requestedByList = [];
    self.expandList = [];
    self.ids = [];
    self.workflowUploadedFiles = [];
    self.workflowModalOptions = {};
    self.workflowFilesList = [];
    self.respondModalOptions = {};
    self.active = {};
    self.active[0] = true;
    self.respondControl = new FormControl();
    this.stateModelAttr = null;
    self.stateModelName = '';
  }

  ngOnInit(): void {
    const self = this;
    self.subscriptions['routeParams'] = self.route.params.subscribe(params => {
      self.serviceId = params.serviceId;
      self.workflowId = params.recordId;
      self.fetchSchema(self.serviceId);
      // self.getWfRecord();
    });
    this.setupShortcuts();
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (!!self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  setupShortcuts() {
    const self = this;
    this.shortcutService.unregisterAllShortcuts(357);

    this.shortcutService.registerShortcut({
      section: 'Workflow',
      label: 'Close Record',
      keys: ['Esc']
    });
    self.subscriptions['closeRecord'] = self.shortcutService.key
      .pipe(filter(event => event.key.toUpperCase() === 'ESCAPE'))
      .subscribe(() => {
        if (this.showRespondView) {
          this.showRespondView = false;
        } else {
          self.closeData();
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Workflow',
      label: 'Show Remarks',
      keys: ['Shift', 'H']
    });
    self.subscriptions['showRemarks'] = self.shortcutService.shiftHKey
      .pipe(filter(() => !this.canRespond && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        this.showRespondView = true;
      });
  }

  fetchSchema(serviceId: string) {
    const self = this;
    self.showLazyLoader = true;
    self.subscriptions['getServiceDetails'] = self.commonService.get('sm', `/${this.commonService.app._id}/service/` + serviceId, { filter: { app: this.commonService.app._id } }).subscribe(
      res => {
        self.showLazyLoader = false;
        self.schema = res;
        self.appService.serviceAPI = '/' + self.commonService.app._id + res.api;
        this.workflowApi = `/${this.commonService.app._id}${res.api}/utils/workflow`;
        this.api = `/${this.commonService.app._id}${res.api}`;
        if (res.wizard && res.wizard.length > 0) {
          self.wizard = res.wizard;
          self.active[0] = true;
        }
        const parsedDef = self.schema.definition;

        self.recordIdName = parsedDef[0].properties.name;
        self.formService.patchType(parsedDef);
        self.formService.fixReadonly(parsedDef);
        self.getExpandList(parsedDef);
        // parsedDef._id = {
        //   type: 'String',
        //   properties: parsedDef._id.properties
        // };
        self.schema.definition = JSON.parse(JSON.stringify(parsedDef));
        self.getWfRecord();
      },
      err => {
        self.loading = false;
        self.commonService.errorToast(err, 'Unable to get the service details, please try again later');
      }
    );
  }

  getWfRecord() {
    const self = this;
    self.showLazyLoader = true;
    self.subscriptions['getRecords'] = self.commonService
      .get('api', this.workflowApi + '/' + self.workflowId + '?expand=true').subscribe(wfRecord => {
        self.showLazyLoader = false;
        self.selectedData = self.appService.cloneObject(wfRecord);
        self.commonService
          .getUser(self.selectedData.requestedBy)
          .then(res => {
            self.selectedData.username = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
          })
          .catch(err => {
            self.selectedData.username = 'ERROR';
          });
        self.ids.push(self.selectedData._id);
        self.appService.remove_idFromArray(self.selectedData);
        self.selectedData.audit.map(user => {
          self.addUserDetailsToAudit(user);
        });
        if (self.selectedData.status === 'Rejected') {
          self.checkForResubmit(self.selectedData);
        }
        let old;
        let newValue;
        if (typeof wfRecord.data.old === 'string') {
          old = JSON.parse(wfRecord.data.old);
        } else {
          old = wfRecord.data.old;
        }
        if (typeof wfRecord.data.new === 'string') {
          newValue = JSON.parse(wfRecord.data.value.new);
        } else {
          newValue = wfRecord.data.new;
        }

        self.value = wfRecord.data.new && wfRecord.data.new !== 'null' ? newValue : old;
        if (self.selectedData.operation !== 'POST') {
          self.activeAuditOldData = wfRecord.data.old ? old : null;
          self.activeAuditNewData = wfRecord.data.new ? newValue : null;
          if (self.activeAuditOldData && self.activeAuditOldData._id) {
            self.value._id = self.activeAuditOldData._id;
          } else {
            self.value._id = self.activeAuditNewData._id;
          }
          if (typeof self.activeAuditOldData === 'string') {
            self.activeAuditOldData = JSON.parse(self.activeAuditOldData);
          }
          if (typeof self.activeAuditNewData === 'string') {
            self.activeAuditNewData = JSON.parse(self.activeAuditNewData);
          }
        }
        // self.rowClicked = true;

        self.definition = self.formService.parseDefinition(self.schema, self.value, false);
        if (self.schema.stateModel && self.schema.stateModel.enabled == true) {
          self.stateModelAttr = self.schema.stateModel.attribute;
          self.initialState = self.schema.stateModel.initialStates[0];
          self.stateModelPath = self.schema.stateModel.states;
          let stateModelDefIndex = self.schema.definition.findIndex(data => data.key == self.stateModelAttr);
          if (stateModelDefIndex > -1) {
            const customLabel = self.schema.definition[stateModelDefIndex].properties?.label;
            self.stateModelName = customLabel ? customLabel : self.schema.definition[stateModelDefIndex].properties.name;
          }
        }
        self.wizard = self.schema.wizard;
        const isEdit = self.selectedData.operation === 'PUT' ? true : false;
        const tempDef = self.formService.parseDefinition(self.schema, self.value, { isEdit });
        self.form = self.fb.group(self.formService.createForm(tempDef));
        self.respondControl = new FormControl('', Validators.required);
      });
  }

  addUserDetailsToAudit(audit: any) {
    const self = this;
    self.commonService
      .getUser(audit.id)
      .then(res => {
        audit.name = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
      })
      .catch(err => {
        audit.name = 'ERROR';
        audit.userDeleted = true;
      });
  }
  checkForResubmit(data) {
    const self = this;
    if (data.documentId) {
      self.commonService
        .getDocumentVersion(data.serviceId, data.documentId)
        .then(_version => {
          data.canResubmit = data.data.old._metadata.version.document === _version;
        })
        .catch(err => {
          data.canResubmit = err;
        });
    } else {
      data.canResubmit = true;
    }
  }
  resubmit() {
    const self = this;
    self.appService.reSubmitData = self.selectedData.data.new;
    if (self.selectedData.operation === 'PUT') {
      self.appService.loadPage.emit('services');
      self.router.navigate(['/', this.commonService.app._id, 'services', self.selectedData.serviceId, 'manage', self.selectedData.documentId], {
        relativeTo: self.route
      });
    } else if (self.selectedData.operation === 'DELETE') {
      self.workflowModalDeleteRef = self.modalService.open(self.workflowModalDelete, { centered: true });
      self.workflowModalDeleteRef.result.then(
        close => {
          if (close) {
            self.deleteRequest();
          }
        },
        dismiss => { }
      );
    } else {
      self.appService.loadPage.emit('services');
      self.router.navigate(['/', this.commonService.app._id, 'services', self.selectedData.serviceId, 'manage'], { relativeTo: self.route });
    }
  }
  deleteRequest() {
    const self = this;
    const api = '/' + self.commonService.app._id + self.schema.api;
    self.subscriptions['delete'] = self.commonService.delete('api', api + '/' + self.selectedData.documentId).subscribe(
      res => {
        if (res._workflow) {
          const workflowData = self.appService.cloneObject(res._workflow[0]);
          self.submitWorkflowFiles(workflowData);
        }
      },
      err => {
        self.commonService.errorToast(err, 'Oops, something went wrong.');
      }
    );
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
    self.subscriptions['updateWorkflow'] = self.commonService
      .put('api', this.workflowApi + '/' + workflowData._id, payload).subscribe(
        res => {
          self.ts.success('Sent for review.');
        },
        err => {
          self.commonService.errorToast(err, 'Oops, something went wrong.');
        }
      );
  }
  closeDiscardModel() {
    const self = this;
    self.respondControl.markAllAsTouched();
    if (self.respondControl.invalid) {
      self.ele.nativeElement.focus();
      return;
    }

    self.discardModalRef.close(true);
  }

  respond(action: string, data?) {
    const self = this;
    this.showLazyLoader = true;
    const payload = {
      action,
      remarks: self.respondModalOptions.remarks,
      attachments: self.workflowUploadedFiles,
      ids: [self.selectedData._id],
      data
    };
    self.subscriptions['respond'] = self.commonService
      .put('api', this.workflowApi + '/action', payload).subscribe(
        res => {
          if (res.passed && res.passed.length > 0) {
            const tempData = res.passed.find(e => e._id === self.selectedData._id);
            if (tempData.status === 'Approved') {
              self.ts.success('Approved');
            } else if (tempData.status === 'Rejected') {
              self.ts.error('Rejected');
            }
          } else if (res.message === 'Sent For Changes.') {
            self.ts.success('Sent for rework.');
          } else if (res.message === 'Submission Successful.') {
            self.ts.success('Draft Submitted');
          } else if (res.message === 'Deletion successful') {
            self.ts.success('Record discarded');
          }
          self.closeData();
          self.showLazyLoader = false;
        },
        err => {
          this.showLazyLoader = false;
          self.commonService.errorToast(err, 'Unable to respond to workflow, please try again later');
        }
      );
  }

  checkStateModel(def) {
    if (this.stateModelAttr && def.key == this.stateModelAttr) {
      return true;
    }
    else return false;
  }

  get stateModelAttrVal() {
    const self = this;
    if (self.form.get(self.stateModelAttr)) {
      return self.form.get(self.stateModelAttr).value;
    }
    else return null;
  }

  get stateModelNextStates() {
    const self = this;
    if (self.form.get(self.stateModelAttr)) {
      let stateModelVal = self.form.get(self.stateModelAttr).value;
      if (stateModelVal != null && this.stateModelPath && this.stateModelPath[stateModelVal]) {
        return (this.stateModelPath[stateModelVal] || []);
      }
    }
    return [];
  }

  saveDraft(reset?) {
    const self = this;
    self
      .simulatePayload()
      .then(data => {
        self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
        if (self.commonService.userDetails.basicDetails.name) {
          self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
        }
        self.workflowModalOptions.remarks = null;
        self.workflowUploadedFiles = [];
        self.workflowModalOptions._id = self.value._id;
        self.workflowModalOptions.operation = self.value._id ? 'PUT' : 'POST';
        self.workflowModalOptions.title = 'Save Draft';
        self.workflowModalOptions.fields = self.appService.countChangedFields(self.value, self.form.getRawValue()) + ' fields';
        self.workflowModalRef = self.modalService.open(self.workflowModal, {
          centered: true
        });
        self.workflowModalRef.result.then(
          close => {
            if (close) {
              // self.form.patchValue(data);
              const isEdit = true;
              const tempDef = self.formService.parseDefinition(self.schema, data, { isEdit });
              self.form = self.fb.group(self.formService.createForm(tempDef));
              const payload = {
                remarks: self.respondModalOptions.remarks,
                attachments: self.workflowUploadedFiles,
                data: self.form.getRawValue()
              };
              self.showLazyLoader = true;
              self.subscriptions['saveDraft'] = self.commonService
                .put('api', this.workflowApi + '/doc/' + self.selectedData._id, payload).subscribe(
                  res => {
                    self.showLazyLoader = false;
                    self.ts.success('Draft saved.');
                  },
                  err => {
                    self.showLazyLoader = false;
                    self.commonService.errorToast(err, 'Unable to save the draft, please try again later');
                  }
                );
            } else {
              self.showLazyLoader = false;
            }
          },
          dismiss => {
            self.showLazyLoader = false;
          }
        );
      })
      .catch(err => {
        self.showLazyLoader = false;
        self.commonService.errorToast(err, 'Validation Failed');
      });
  }

  setStateAndSave(state) {
    const self = this;
    self.form.get(self.stateModelAttr).patchValue(state);
    self.submitDraft();
  }

  submitDraft() {
    const self = this;
    self.showLazyLoader = true;
    self
      .simulatePayload()
      .then(data => {
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
          self.workflowModalRef = self.modalService.open(self.workflowModal, {
            centered: true
          });
        }
        self.workflowModalRef.result.then(
          close => {
            if (close) {
              // self.form.patchValue(data);
              const isEdit = true;
              const tempDef = self.formService.parseDefinition(self.schema, data, { isEdit });
              self.form = self.fb.group(self.formService.createForm(tempDef));
              self.value = data;
              self.respond('Submit', self.form.getRawValue());
            } else {
              self.showLazyLoader = false;
              self.workflowModalRef = null;
            }
          },
          dismiss => {
            self.showLazyLoader = false;
            self.workflowModalRef = null;
          }
        );
      })
      .catch(err => {
        self.showLazyLoader = false;
        self.commonService.errorToast(err, 'Validation Failed');
      });
  }
  simulatePayload() {
    const self = this;
    if (this.editMode) {
      this.oldValue = self.appService.cloneObject(self.value);
      this.value = this.form.value;
    }
    let payload = self.appService.cloneObject(self.value);
    if (self.canEditDraft) {
      payload = self.form.getRawValue();
      self.appService.cleanPayload(payload, self.definition, false);
    }
    const operation = self.selectedData.operation;
    const apiPath = self.appService.serviceAPI + '/utils/simulate?operation=' + operation + '&source=Draft Submitted';
    return new Promise((resolve, reject) => {
      self.commonService.post('api', apiPath, payload).subscribe(
        res => {
          self.appService.fixArrayInPayload(res, self.definition, false);
          resolve(res);
        },
        err => {
          reject(err);
        }
      );
    });
  }
  uploadWorkflowFile(ev) {
    const self = this;
    const file = ev.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);
    const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
    if (indexOfValue < 0) {
      self.showLazyLoader = true;
      self.subscriptions['uploadFile_' + file.name] = self.commonService
        .upload('api', this.api, formData, false).subscribe(
          event => {
            if (event.type === HttpEventType.UploadProgress) {
              // self.processing.progress = Math.floor(event.loaded / event.total * 100);
            }
            if (event.type === HttpEventType.Response) {
              self.showLazyLoader = false;

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
          },
          err => {
            self.showLazyLoader = false;
            self.commonService.errorToast(err, 'Unable to upload the file, please try again later.');
          }
        );
    }
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

  closeData() {
    const self = this;
    if (this.editMode) {
      this.editMode = false;
      this.value = this.appService.cloneObject(this.oldValue);
      this.oldValue = null;
      return;
    }
    self.router.navigate(['/', this.commonService.app._id, 'workflow', self.appService.serviceId]);
  }
  discardDraft() {
    const self = this;
    self.workflowModalOptions._id = self.value._id;
    self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
    if (self.commonService.userDetails.basicDetails.name) {
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
    }
    self.discardModalRef = self.modalService.open(self.discardModal, {
      centered: true
    });
    self.discardModalRef.result.then(
      close => {
        if (close) {
          self.respondModalOptions.remarks = self.respondControl.value;

          self.respond('Discard');
        }
      },
      dismiss => { }
    );
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
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'left', event.layerX - 200 + 'px');
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'top', event.layerY + 25 + 'px');
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'block');
    self.allStepsDropdown.nativeElement.focus();
  }
  hideAllStepsDropdown(event) {
    const self = this;
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'none');
  }
  triggerHook(hook: any) {
    const self = this;
    const api = '/' + self.commonService.app._id + self.schema.api;
    self.showLazyLoader = true;
    self.subscriptions['experience-hook'] = self.commonService
      .post('api', api + `/utils/experienceHook?name=${hook.name}`, {
        data: self.form.getRawValue()
      })
      .subscribe(
        res => {
          self.showLazyLoader = false;
          if (res.data && typeof res.data === 'object') {
            let tempValue = self.appService.cloneObject(self.form.getRawValue());
            if (res.data._id) {
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
        },
        err => {
          self.showLazyLoader = false;
          self.commonService.errorToast(err, 'Unable no trigger the hook, please try again later');
        }
      );
  }
  createData(oldData, newData, def) {
    const isEdit = this.selectedData.operation === 'PUT' ? true : false;
    def.forEach(element => {
      if (element.type === 'Object' && !element.properties.schemaFree) {
        this.createData(oldData[element.key], newData[element.key], element.definition);
      }
      if (isEdit) {
        if (newData && newData.hasOwnProperty(element.key) && !element.properties.createOnly) {
          oldData[element.key] = newData[element.key];
        }
      } else if (newData && newData.hasOwnProperty(element.key)) {
        oldData[element.key] = newData[element.key];
      }
    });
    return oldData;
  }
  removeWorkflowFile(index: number) {
    const self = this;
    self.workflowUploadedFiles.splice(index, 1);
    self.workflowFilesList.splice(index, 1);
  }
  actionResponse(value) {
    const self = this;
    self.showHeaderOnly = true;
    self.showRespondView = false;
    self.respondControl.patchValue(value.respondControl);
    if (value && value.canCloseView) {
      self.closeData();
    }
  }
  getExpandList(parsedDef, parent?) {
    const self = this;
    if (parsedDef) {
      parsedDef.forEach(def => {
        if (def.type && (def.type === 'Relation' || def.type === 'User')) {
          if (def.properties.relatedViewFields.length) {
            def.properties.relatedViewFields.forEach(ele => {
              if (parent) {
                self.expandList.push(parent + '.' + def.properties.dataKey + '.' + ele.key);
              } else {
                self.expandList.push(def.properties.dataKey + '.' + ele.key);
              }
            });
          }
          if (def.properties.relatedSearchField !== '_id') {
            if (parent) {
              self.expandList.push(parent + '.' + def.properties.dataKey + '.' + def.properties.relatedSearchField);
            } else {
              self.expandList.push(def.properties.dataKey + '.' + def.properties.relatedSearchField);
            }
          }
        } else if (def.type && def.type === 'Array') {
          let par = def.key;
          if (parent) {
            par = def.key + parent;
          }
          const selfObj = def.definition[0] || {};
          if (selfObj.type === 'Relation' || def.type === 'User') {
            selfObj.properties.relatedViewFields.forEach(ele => {
              self.expandList.push(def.properties.dataKey + '.' + ele.key);
            });
            if (selfObj.properties.relatedSearchField !== '_id') {
              self.expandList.push(def.properties.dataKey + '.' + selfObj.properties.relatedSearchField);
            }
          } else if (selfObj.type === 'Object' && !selfObj.properties.schemaFree) {
            self.getExpandList(selfObj.definition, par);
          }
        } else if (def.type && def.type === 'Object' && !def.properties.schemaFree) {
          self.getExpandList(def.definition, def.key);
        }
      });
    }
  }

  openRemarksModal() {
    const remarksModal: NgbModalRef = this.modalService.open(WorkflowRemarksViewComponent, { centered: true, size: 'lg' });
    remarksModal.componentInstance.workflowData = this.selectedData;
    remarksModal.componentInstance.serviceData = this.schema;
    remarksModal.result.then(close => {
      if (close) {
        this.openRespondModal();
      }
    }, dismiss => { });
  }

  openRespondModal() {
    const respondModal: NgbModalRef = this.modalService.open(WorkflowRespondViewComponent, { centered: true, size: 'lg', beforeDismiss: () => false });
    respondModal.componentInstance.workflowData = this.selectedData;
    respondModal.componentInstance.serviceData = this.schema;
    respondModal.result.then(close => {
      if (close) {
        console.log(close);
      }
    }, dismiss => { });
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
    if (
      self.selectedData &&
      (self.hasPermission('POST') || self.hasPermission('PUT')) &&
      self.selectedData.status === 'Rejected' &&
      (self.selectedData.operation === 'POST' || self.selectedData.canResubmit)
    ) {
      return true;
    }
    return false;
  }

  get canRespond() {
    const self = this;
    let audit;
    if (self.selectedData && self.selectedData.audit) {
      audit = self.selectedData.audit[self.selectedData.audit.length - 1];
    }
    if (self.selectedData.requestedBy == self.commonService.userDetails._id) {
      return false;
    }
    if (audit && audit.id == self.commonService.userDetails._id) {
      return false;
    }
    if (self.selectedData.status !== 'Pending') {
      return false;
    }
    if (!this.commonService.canRespondToWF(this.schema, self.selectedData.checkerStep)) {
      return false;
    }

    if (self.schema.status !== 'Active') {
      return false;
    }
    return true;
  }

  get canEditDocument() {
    if (
      this.selectedData &&
      this.hasPermission('PUT') &&
      this.selectedData.status !== 'Rejected' &&
      this.selectedData.status !== 'Approved') {
      return true;
    }
    return false;
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
  get isScrollExist() {
    const ele = document.getElementById('workflowData');
    if (ele.clientWidth === ele.scrollWidth) {
      return false;
    } else {
      return true;
    }
  }
  hasPermission(method?: string) {
    const self = this;
    return self.commonService.hasPermission(self.schema._id, self.schema.role.roles, method);
  }
}
