import { Component, OnInit, OnDestroy, ViewChild, Renderer2, ElementRef, HostListener, TemplateRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbTooltipConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { FormService } from 'src/app/service/form.service';
import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { HttpEventType } from '@angular/common/http';
import { CanComponentDeactivate } from 'src/app/guard/route.guard';

@Component({
  selector: 'odp-bulk-update',
  templateUrl: './bulk-update.component.html',
  styleUrls: ['./bulk-update.component.scss']
})
export class BulkUpdateComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  // @ViewChild('cancelModal', { static: false }) pageChangeModalTemplate;
  @ViewChild('partialSuccess', { static: false })
  partialSuccess: TemplateRef<HTMLElement>;
  @ViewChild('workflowModal', { static: false })
  workflowModal: TemplateRef<HTMLElement>;
  @ViewChild('allStepsDropdown', { static: false })
  allStepsDropdown: ElementRef;
  @ViewChild('confirmDiscardModal', { static: false })
  confirmDiscardModal: TemplateRef<HTMLElement>;
  @ViewChild('pageChangeModalTemplate', { static: false })
  pageChangeModalTemplate;
  workflowModalRef: NgbModalRef;
  confirmDiscardModalRef: NgbModalRef;
  pageChangeModalTemplateRef: NgbModalRef;
  partialSuccessRef: NgbModalRef;
  isEdit: boolean;
  isDraft: boolean;
  api: string;
  title: string;
  version: string;
  ID: string;
  schema: any;
  definition: Array<any>;
  active: any;
  wizard: Array<any>;
  form: FormGroup;
  cancelUrl: string;
  currentStep: number;
  subscriptions: any;
  showLazyLoader: boolean;
  showLazyLoaderPage: boolean;
  value: any;
  prevUrl: string;
  workflowModalOptions: any;
  workflowData: any;
  workflowUploadedFiles: Array<any>;
  workflowFilesList: Array<any>;
  // parsedDefinition: any;
  toggleAllActionsDropDown: boolean;
  reqInProgress: boolean;
  draftReqInProgress: boolean;
  bulkEditIds: Array<string>;
  result: Array<any>;
  stateModelAttr: string;
  @HostListener('window:beforeunload', ['$event'])
  public beforeunloadHandler($event) {
    if (this.form.dirty) {
      $event.returnValue = 'Are you sure?';
    }
  }
  constructor(
    private renderer: Renderer2,
    private appService: AppService,
    private commonService: CommonService,
    private formService: FormService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private ts: ToastrService,
    private shortcutService: ShortcutService,
    private ngbToolTipConfig: NgbTooltipConfig,
    private modalService: NgbModal
  ) {
    const self = this;
    self.workflowModalOptions = {};
    self.workflowUploadedFiles = [];
    self.workflowFilesList = [];
    self.subscriptions = {};
    self.wizard = [];
    self.active = {};
    self.definition = [];
    self.schema = {};
    self.reqInProgress = false;
    self.draftReqInProgress = false;
    self.form = self.fb.group({});
    self.bulkEditIds = [];
    self.result = [];
    self.stateModelAttr = null;
  }

  ngOnInit() {
    const self = this;
    self.isEdit = true;
    self.cancelUrl = '/' + this.commonService.app._id + '/services/' + self.appService.serviceId + '/list';
    if (!self.appService.bulkEditIds || self.appService.bulkEditIds.length === 0) {
      return self.router.navigate([self.cancelUrl]);
    }
    self.bulkEditIds = self.appService.bulkEditIds;
    self.appService.bulkEditIds = null;
    self.showLazyLoader = true;
    self.ngbToolTipConfig.container = 'body';
    self.shortcutService.unregisterAllShortcuts(357);
    self.shortcutService.registerShortcut({
      section: 'Data Service',
      label: 'Save',
      keys: ['Ctrl', 'S']
    });
    self.subscriptions['ctrlSKey'] = self.shortcutService.ctrlSKey.subscribe(e => {
      self.save();
    });
    if (self.appService.prevUrl) {
      const tempArr = self.appService.prevUrl.split('/');
      self.prevUrl = tempArr[tempArr.length - 2] + '/' + tempArr[tempArr.length - 1];
      self.appService.prevUrl = null;
    }
    self.form = self.fb.group({});
    self.getSchema(self.appService.serviceId);
    self.subscriptions['sessionExpired'] = self.commonService.sessionExpired.subscribe(() => {
      self.form.markAsPristine();
    });
    self.subscriptions['appChange'] = self.appService.appChange.subscribe(app => {
      self.router.navigate(['/', this.commonService.app._id]);
    });
  }
  ngOnDestroy() {
    const self = this;
    if (self.workflowModalRef) {
      self.workflowModalRef.close();
    }
    if (self.confirmDiscardModalRef) {
      self.confirmDiscardModalRef.close();
    }
    if (self.pageChangeModalTemplateRef) {
      self.pageChangeModalTemplateRef.close();
    }
    if (self.partialSuccessRef) {
      self.partialSuccessRef.close();
    }
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  checkStateModel(def) {
    if (this.stateModelAttr && def.key == this.stateModelAttr) {
      return true;
    }
    else return false;
  }

  getSchema(serviceId: string) {
    const self = this;
    const options = {
      select: 'api definition name relatedSchemas wizard stateModel workflowConfig'
    };
    self.subscriptions['getSchema'] = self.commonService.get('sm', '/service/' + serviceId, options).subscribe(
      res => {
        const parsedDef = res.definition;
        self.formService.patchType(parsedDef);
        self.formService.fixReadonly(parsedDef);
        res.definition = JSON.parse(JSON.stringify(parsedDef));
        if (res.stateModel && res.stateModel.enabled == true) {
          self.stateModelAttr = res.stateModel.attribute;
        }
        self.title = res.name;
        self.api = '/' + self.commonService.app._id + res.api;
        self.appService.serviceAPI = '/' + self.commonService.app._id + res.api;
        self.version = res.version;
        self.schema = res;
        if (res.wizard && res.wizard.length > 0) {
          self.wizard = res.wizard;
          self.active[0] = true;
          self.currentStep = 0;
        }
        self.buildForm(res);
        self.showLazyLoader = false;
      },
      err => {
        self.showLazyLoader = false;
        if (err.status === 403) {
          self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
            state: {
              noRedirect: true,
              serviceId: null
            }
          });
        } else if (err.status === 404) {
          self.router.navigate(['/', this.commonService.app._id,]);
        } else {
          self.commonService.errorToast(err, 'Unable to fetch details');
        }
      }
    );
  }

  buildForm(data, value?) {
    const self = this;
    if (self.isEdit && !self.hasPermission('PUT')) {
      return self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list']);
    }
    const tempDef = self.formService.parseDefinition(data, value, {
      isEdit: self.isEdit
    });
    self.form = self.fb.group(self.formService.createForm(tempDef));
    self.form.get('_id').disable();
    Object.keys(self.form.controls).forEach(key => {
      self.form.get(key).disable();
    });
    self.definition = tempDef;
  }

  showCard(val) {
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

  saveAsDraft(reset?) {
    const self = this;
    self.draftReqInProgress = true;
    self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
    if (self.commonService.userDetails.basicDetails.name) {
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
    }
    self.workflowModalOptions._id = self.ID;
    self.workflowModalOptions.remarks = null;
    self.workflowUploadedFiles = [];
    self.workflowModalOptions.operation = self.isEdit ? 'PUT' : 'POST';
    if (self.isEdit) {
      self.workflowModalOptions.title = 'Save Draft';
      self.workflowModalOptions.fields = self.appService.countChangedFields(self.value, self.form.getRawValue()) + ' fields';
    }
    self.workflowModalRef = self.modalService.open(self.workflowModal, {
      centered: true,
      beforeDismiss: () => {
        self.reqInProgress = false;
        return true;
      }
    });
    self.workflowModalRef.result.then(
      close => {
        self.submitValue(reset, true);
      },
      dismiss => {
        self.showLazyLoader = false;
      }
    );
  }

  save(reset?) {
    const self = this;
    self.reqInProgress = true;
    if (self.hasWorkflow) {
      self
        .simulatePayload()
        .then(data => {
          self.form.patchValue(data);
          self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
          if (self.commonService.userDetails.basicDetails.name) {
            self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
          }
          self.workflowModalOptions._id = self.ID;
          self.workflowModalOptions.operation = self.isEdit ? 'PUT' : 'POST';
          if (self.isEdit) {
            self.workflowModalOptions.title = 'Submit edit record';
            self.workflowModalOptions.fields = self.appService.countChangedFields(self.value, self.form.getRawValue()) + ' fields';
          } else {
            self.workflowModalOptions.title = 'Submit new record';
            self.workflowModalOptions.fields = 'New document';
          }
          self.workflowModalRef = self.modalService.open(self.workflowModal, {
            centered: true,
            beforeDismiss: () => {
              self.reqInProgress = false;
              return true;
            }
          });
          self.workflowModalRef.result.then(
            close => {
              if (close) {
                self.submitValue(reset);
              }
            },
            dismiss => { }
          );
        })
        .catch(err => {
          self.showLazyLoader = false;
          self.reqInProgress = false;
          self.commonService.errorToast(err, 'Validation Failed');
        });
    } else {
      self.submitValue(reset);
    }
  }

  submitValue(reset?: boolean, draft?: boolean) {
    const self = this;
    if (!self.form.valid) {
      return;
    }
    const payload = self.form.value;
    const url = self.api + '/bulkUpdate?id=' + self.bulkEditIds.join(',');
    self.showLazyLoader = true;
    self.subscriptions['saveRecord'] = self.commonService.put('api', url, payload).subscribe(
      res => {
        const arr = [];
        if (res._workflow) {
          res._workflow.forEach(wf => {
            arr.push(self.submitWorkflowFiles(wf._id, reset, draft));
          });
          self.resolveAll(reset, draft, res, arr);
        } else if (draft) {
          res._workflow.forEach(wf => {
            arr.push(self.submitWorkflowFiles(wf._id, reset, draft));
          });
          self.resolveAll(reset, draft, res, arr);
        } else {
          if (res && res.every(e => e._id)) {
            self.showLazyLoader = false;
            self.reqInProgress = false;
            self.draftReqInProgress = false;
            self.afterSubmit(reset);
          } else {
            self.result = [];
            res.forEach((e, i) => {
              if (e._id) {
                self.result.push({
                  _id: e._id,
                  message: 'Success',
                  success: true
                });
              } else {
                self.result.push({
                  _id: self.bulkEditIds[i],
                  message: e.message,
                  success: false
                });
              }
            });
            self.partialSuccessRef = self.modalService.open(self.partialSuccess, { centered: true, size: 'lg' });
            self.partialSuccessRef.result.then(
              close => {
                self.resolveAll(reset, draft, res, arr);
              },
              dismiss => {
                self.resolveAll(reset, draft, res, arr);
              }
            );
          }
        }
      },
      err => {
        self.showLazyLoader = false;
        self.reqInProgress = false;
        self.draftReqInProgress = false;
        self.commonService.errorToast(err, 'Oops, something went wrong.');
      }
    );
  }

  resolveAll(reset, draft, res, arr) {
    const self = this;
    Promise.all(arr)
      .then(() => {
        self.showLazyLoader = false;
        self.reqInProgress = false;
        self.draftReqInProgress = false;
        if (res._workflow) {
          self.ts.success('Work item submitted for review.');
        } else if (draft) {
          self.ts.success('Draft Created.');
        } else {
          self.ts.success('Saved.');
        }
        self.afterSubmit(reset);
      })
      .catch(err => {
        self.showLazyLoader = false;
        self.reqInProgress = false;
        self.draftReqInProgress = false;
        if (res._workflow) {
          self.ts.success('Work item submitted for review.');
        } else if (draft) {
          self.ts.success('Draft Created.');
        } else {
          self.ts.success('Saved.');
        }
        self.afterSubmit(reset);
      });
  }

  simulatePayload() {
    const self = this;
    const payload = self.appService.cloneObject(self.form.getRawValue());
    payload._id = self.ID;
    self.appService.cleanPayload(payload, self.definition, self.isEdit);
    const url = self.api + '/utils/simulate?operation=PUT&generateId=false&source=Document Update Request';
    return new Promise((resolve, reject) => {
      self.commonService.post('api', url, payload).subscribe(
        res => {
          self.appService.fixArrayInPayload(res, self.definition, self.isEdit);
          resolve(res);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  afterSubmit(reset) {
    const self = this;
    if (reset) {
      self.buildForm(self.schema);
      self.showCard(0);
      self.workflowFilesList = [];
      self.workflowData = {};
      self.workflowModalOptions = {};
      self.workflowUploadedFiles = [];
    } else {
      self.form.markAsPristine();
      if (self.hasWorkflow) {
        self.appService.loadPage.emit('workflow');
        self.router.navigate(['/', this.commonService.app._id, 'workflow', self.schema._id]);
      } else {
        self.router.navigate([self.cancelUrl]);
      }
    }
  }

  showAllStepsDropdown(event) {
    const self = this;
    // self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'left', event.layerX + 'px');
    // self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'top', event.layerY + 'px');
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'block');
    self.allStepsDropdown.nativeElement.focus();
  }
  hideAllStepsDropdown(event) {
    const self = this;
    self.renderer.setStyle(self.allStepsDropdown.nativeElement, 'display', 'none');
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

  hasPermission(method?: string): boolean {
    const self = this;
    return self.commonService.hasPermission(self.schema._id, method);
  }

  uploadWorkflowFile(ev) {
    const self = this;
    const file = ev.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);

    const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
    if (indexOfValue < 0) {
      self.showLazyLoaderPage = true;
      self.subscriptions['uploadFile_' + file.name] = self.commonService
        .upload('api', this.api, formData, false).subscribe(
          event => {
            if (event.type === HttpEventType.UploadProgress) {
              // self.processing.progress = Math.floor(event.loaded / event.total * 100);
            }
            if (event.type === HttpEventType.Response) {
              self.showLazyLoaderPage = false;
              if (self.workflowFilesList.length === 0) {
                self.workflowFilesList.push(file);
              } else {
                const indexValue = self.workflowFilesList.findIndex(val => val.name === file.name);
                if (indexValue < 0) {
                  self.workflowFilesList.push(file);
                }
              }
              self.workflowUploadedFiles.push(event.body);
              ev.target.value = '';
            }
          },
          err => {
            self.showLazyLoaderPage = false;
            self.commonService.errorToast(err, 'Unable to upload the file, please try again later.');
          }
        );
    }
  }

  removeWorkflowFile(index: number) {
    const self = this;
    self.workflowUploadedFiles.splice(index, 1);
    self.workflowFilesList.splice(index, 1);
  }

  submitWorkflowFiles(wfId, reset, isDraft?) {
    const self = this;
    const payload = {
      audit: [
        {
          by: 'user',
          id: this.commonService.userDetails._id,
          action: isDraft ? 'Draft' : 'Submit',
          remarks: self.workflowModalOptions.remarks,
          timestamp: Date.now(),
          attachments: self.workflowUploadedFiles
        }
      ]
    };
    return self.commonService.put('api', this.api + '/utils/workflow' + wfId, payload).toPromise();
  }

  triggerHook(hook: ExpHook) {
    const self = this;
    self.showLazyLoader = true;

    self.commonService
      .post('api', self.api + `/utils/experienceHook?name=${hook.name}`, {
        data: self.form.getRawValue()
      })
      .subscribe(
        res => {
          if (res.data && typeof res.data === 'object') {
            let tempValue = self.appService.cloneObject(self.form.getRawValue());
            if (!res.data._id || (res.data._id && this.isEdit)) {
              res.data._id = tempValue._id;
            }

            const oldValDef = self.formService.parseDefinition(self.schema, tempValue, { isEdit: self.isEdit });
            // const newValDef = self.formService.parseDefinition(self.schema, res.data, { isEdit: self.isEdit });
            tempValue = self.createData(tempValue, res.data, oldValDef);
            const tempDef = self.formService.parseDefinition(self.schema, tempValue, { isEdit: self.isEdit });
            self.form = self.fb.group(self.formService.createForm(tempDef));

            // self.form.patchValue(tempValue);
            // self.form.patchValue(res.data);
            self.form.markAsDirty();
          }
          self.showLazyLoader = false;

          if (res.message) {
            self.ts.success(res.message);
          }
        },
        err => {
          self.showLazyLoader = false;
          self.commonService.errorToast(err, 'Unable to trigger the hook, please try again later.');
        }
      );
  }
  createData(oldData, newData, def) {
    def.forEach(element => {
      if (element.type === 'Object') {
        this.createData(oldData[element.key], newData[element.key], element.definition);
      } else if (newData && newData.hasOwnProperty(element.key) && !element.properties.createOnly) {
        oldData[element.key] = newData[element.key];
      }
    });
    return oldData;
  }

  addPlaceholderFormCntrls(def, resData) {
    const self = this;
    def.forEach(attribute => {
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

  canDeactivate(): Promise<boolean> | boolean {
    const self = this;
    if (self.form.dirty) {
      return new Promise((resolve, reject) => {
        if (self.pageChangeModalTemplateRef) {
          self.pageChangeModalTemplateRef.close(false);
        }
        self.pageChangeModalTemplateRef = self.modalService.open(self.pageChangeModalTemplate, { centered: true });
        self.pageChangeModalTemplateRef.result.then(
          close => {
            resolve(close);
          },
          dismiss => {
            resolve(false);
          }
        );
      });
    }
    return true;
  }

  get stepFirst() {
    const self = this;
    return self.currentStep === 0;
  }
  get stepLast() {
    const self = this;
    return self.currentStep === self.wizard.length - 1;
  }

  get changesDone() {
    const self = this;
    return self.form.dirty;
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
