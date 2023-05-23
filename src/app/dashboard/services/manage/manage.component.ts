import { Component, OnInit, OnDestroy, ViewChild, Renderer2, ElementRef, HostListener, TemplateRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbTooltipConfig, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { FormService } from 'src/app/service/form.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { HttpEventType } from '@angular/common/http';
import { CanComponentDeactivate } from 'src/app/guard/route.guard';
import { DashboardService } from '../../dashboard.service';
import * as _ from 'lodash'


@Component({
  selector: 'odp-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent implements OnInit, OnDestroy, CanComponentDeactivate {
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
  toggleAllActionsDropDown: boolean;
  reqInProgress: boolean;
  draftReqInProgress: boolean;
  isClone: boolean;
  restrictOverflow: boolean;
  stateModelAttr: string;
  stateModelName: string;
  nextStates: any;
  initialState: any;
  stateModelPath: any;
  searchTerm: string;
  tempState: string;
  isInitialStateOnEdit: boolean;
  isSchemaFree: boolean;
  selectedEditorTheme: any;
  selectedFontSize: any;
  schemaFreeCode: any;
  invalidSchemaFreeRecord: boolean;
  statusArray: any = [];
  ogStatusArray: any;
  currentState: any;
  breadcrumb: Array<any>
  toggleDropdown: boolean;
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
    private modalService: NgbModal,
    private dashboardService: DashboardService,
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
    this.restrictOverflow = false;
    this.stateModelAttr = null;
    self.stateModelName = '';
    self.tempState = null;
    self.isInitialStateOnEdit = false;
    self.isSchemaFree = false;
    this.selectedEditorTheme = 'vs-light';
    this.selectedFontSize = 14;
    this.schemaFreeCode = null;
    self.invalidSchemaFreeRecord = false;
  }

  ngOnInit() {
    const self = this;
    this.route.data.subscribe(data => {
      if (data.breadcrumb) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
      }
    })
    self.cancelUrl = '/' + this.commonService.app._id + '/services/' + self.appService.serviceId + '/list';
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
    self.shortcutService.registerShortcut({
      section: 'Data Service',
      label: 'Reset and Save',
      keys: ['Ctrl', 'Shift', 'S']
    });
    self.subscriptions['ctrlShiftSKey'] = self.shortcutService.ctrlShiftSKey.subscribe(e => {
      if (!self.isEdit) {
        self.save(true);
      }
    });
    if (self.appService.prevUrl) {
      const tempArr = self.appService.prevUrl.split('/');
      self.prevUrl = tempArr[tempArr.length - 2] + '/' + tempArr[tempArr.length - 1];
      self.appService.prevUrl = null;
    }
    self.form = self.fb.group({});
    self.getSchema(self.appService.serviceId);
    self.subscriptions['routeParams'] = self.route.params.subscribe(params => {
      if (params.recordId) {
        self.ID = params.recordId;
        self.isEdit = true;
        if (self.prevUrl) {
          const tempUrl = self.cancelUrl.split('/');
          tempUrl.pop();
          self.cancelUrl = tempUrl.join('/');
          self.cancelUrl += '/' + self.prevUrl;
        }
      }
      if (self.appService.cloneRecordId) {
        self.ID = self.appService.cloneRecordId;
        self.isClone = true;
      }
    });
    self.subscriptions['sessionExpired'] = self.commonService.sessionExpired.subscribe(() => {
      self.form.markAsPristine();
    });
    self.subscriptions['appChange'] = self.appService.appChange.subscribe(app => {
      self.router.navigate(['/', this.commonService.app._id,]);
    });
    this.subscriptions['restrictOverflow'] = this.formService.overFlowSubject.subscribe(restrictOverflow => {
      this.restrictOverflow = restrictOverflow;
    });
  }

  ngOnDestroy() {
    const self = this;
    self.appService.cloneRecordId = null;
    if (self.workflowModalRef) {
      self.workflowModalRef.close();
    }
    if (self.confirmDiscardModalRef) {
      self.confirmDiscardModalRef.close();
    }
    if (self.pageChangeModalTemplateRef) {
      self.pageChangeModalTemplateRef.close();
    }
    self.appService.cloneRecordId = null;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  schemaFreeCodeError($event) {
    this.invalidSchemaFreeRecord = $event;
  }

  checkStateModel(def) {
    if (this.stateModelAttr && def.key == this.stateModelAttr) {
      return true;
    }
    else return false;
  }

  stateModelAttrVal() {
    const self = this;
    if (self.form.get(self.stateModelAttr)) {
      return self.form.get(self.stateModelAttr).value;
    }
    else return null;
  }

  stateModelNextStates() {
    const self = this;
    if (self.form.get(self.stateModelAttr)) {
      let stateModelVal = self.form.get(self.stateModelAttr).value;
      if (stateModelVal != null && this.stateModelPath && this.stateModelPath[stateModelVal]) {

        return this.stateModelPath[stateModelVal];
      }
    }
    return [];
  }

  getAllStates(data?) {
    const self = this;
    if (self.stateModelPath) {
      if (data?.[self.stateModelAttr] && self.ID) {
        self.currentState = data[self.stateModelAttr]
      }
      else {
        self.currentState = self.initialState
      }
      const states = self.stateModelPath?.[self.currentState];
      // states.unshift(self.currentState)
      self.statusArray = self.ID ? states : self.initialState
      self.ogStatusArray = self.statusArray

    }
  }

  searchState(event) {
    this.statusArray = this.ogStatusArray.filter(ele => ele.toLowerCase().includes(event.toLowerCase()))
  }

  resetSearch() {
    this.statusArray = _.cloneDeep(this.ogStatusArray)
  }

  // setStateAndSave(state) {
  //   const self = this;
  //   if (!self.hasWorkflow) {
  //     self.form.get(self.stateModelAttr).patchValue(state);
  //   } else {
  //     self.tempState = state;
  //   }
  //   self.save();
  // }

  changeStatus(state) {
    const self = this;
    self.form.get(self.stateModelAttr).patchValue(state);
    this.currentState = state;
    this.toggleDropdown = false
    // if (!self.hasWorkflow) {
    //   self.form.get(self.stateModelAttr).patchValue(event);
    // } else {
    //   self.tempState = event;
    // }
    // console.log(self.form.get(self.stateModelAttr))
  }

  getSchema(serviceId: string) {
    const self = this;
    const options = {
      select: 'api definition name relatedSchemas wizard stateModel workflowConfig role schemaFree',
      filter: { app: this.commonService.app._id }
    };
    self.subscriptions['getSchema'] = self.commonService.get('sm', `/${this.commonService.app._id}/service/` + serviceId, options).subscribe(
      res => {
        const parsedDef = res.definition;
        self.formService.patchType(parsedDef);
        self.formService.fixReadonly(parsedDef);
        res.definition = JSON.parse(JSON.stringify(parsedDef));
        if (res.stateModel && res.stateModel.enabled == true) {
          self.stateModelAttr = res.stateModel.attribute;
          self.initialState = res.stateModel.initialStates[0];
          self.stateModelPath = res.stateModel.states;
          let stateModelDefIndex = res.definition.findIndex(data => data.key == self.stateModelAttr);
          if (stateModelDefIndex > -1) {
            const customLabel = res.definition[stateModelDefIndex].properties?.label;
            self.stateModelName = customLabel ? customLabel : res.definition[stateModelDefIndex].properties.name;
          }
        }

        if (!this.breadcrumb.find(ele => ele === res.name)) {
          this.breadcrumb.push(res.name)
        }
        //self.isSchemaFree = true;
        if (res.schemaFree) {
          self.isSchemaFree = res.schemaFree;
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
        if (self.isEdit || self.isClone) {
          self.subscriptions['getDetails'] = self.commonService.get('api', self.api + '/' + self.ID, { expand: true, decrypt: true }).subscribe(
            data => {
              self.showLazyLoader = false;
              self.getAllStates(data)
              if (self.appService.reSubmitData) {
                self.value = self.appService.cloneObject(self.appService.reSubmitData);
                self.buildForm(res, self.appService.cloneObject(self.appService.reSubmitData));
                self.appService.reSubmitData = null;
              } else {
                if (self.isClone) {
                  delete data._id;
                  if (self.stateModelAttr && data[self.stateModelAttr] && self.initialState) {
                    data[self.stateModelAttr] = self.initialState;
                    self.currentState = self.initialState;
                  }
                  self.ID = null;
                }
                if (self.stateModelAttr && !data.hasOwnProperty(self.stateModelAttr) && self.initialState) {
                  data[self.stateModelAttr] = self.initialState;
                  self.isInitialStateOnEdit = true;
                }
                self.value = self.appService.cloneObject(data);
                if (!self.isSchemaFree) {
                  self.buildForm(res, data);
                } else {
                  self.schemaFreeCode = JSON.parse(JSON.stringify(data));
                  delete self.schemaFreeCode["_metadata"]
                  delete self.schemaFreeCode["__v"]
                  if (self.schemaFreeCode["_workflow"]) {
                    delete self.schemaFreeCode["_workflow"];
                  }
                }
              }
            },
            err => {
              if (err.status === 403) {
                self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
                  state: {
                    noRedirect: true,
                    serviceId
                  }
                });
              } else {
                self.commonService.errorToast(err, 'Unable to fetch data');
              }
            }
          );
        } else {
          self.showLazyLoader = false;
          self.getAllStates()
          if (self.appService.reSubmitData) {
            self.buildForm(res, self.appService.cloneObject(self.appService.reSubmitData));
            self.appService.reSubmitData = null;
          } else if (self.appService.draftData) {
            let data = self.appService.draftData.data.new;
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }
            self.workflowData = self.appService.draftData;
            self.isDraft = true;
            self.buildForm(res, data);
            self.appService.draftData = null;
            self.form.markAsDirty();
          } else {
            self.buildForm(res);
          }
        }
        // add initial state for state model in create mode
        if (!self.ID && self.stateModelAttr) {
          self.form.get(self.stateModelAttr).patchValue(self.initialState);
        }
        if (this.breadcrumb) {
          if (self.ID) {
            this.breadcrumb.push(self.ID)
          }
          else {
            this.breadcrumb.push('New')
          }
          this.commonService.breadcrumbPush(this.breadcrumb)
        }


      },
      err => {
        self.showLazyLoader = false;
        if (err.status === 403) {
          self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
            state: {
              noRedirect: true,
              serviceId
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
    if (!self.isEdit && !self.hasPermission('POST')) {
      self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list']);
      return;
    }
    if (self.isEdit && !self.hasPermission('PUT')) {
      self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list']);
    }
    const tempDef = self.formService.parseDefinition(data, value, {
      isEdit: self.isEdit
    });
    self.form = self.fb.group(self.formService.createForm(tempDef));
    self.definition = tempDef;
    self.form.markAsDirty();
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
    // document.getElementById('step-' + val).scrollIntoView();
  }

  saveAsDraft(reset?) {
    const self = this;
    self.draftReqInProgress = true;
    self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
    if (self.commonService.userDetails.basicDetails.name) {
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
    }
    if (self.isEdit) {
      self.workflowModalOptions._id = self.ID;
    }
    self.workflowModalOptions.remarks = null;
    self.workflowUploadedFiles = [];
    self.workflowModalOptions.operation = self.isEdit ? 'PUT' : 'POST';
    if (self.isEdit) {
      self.workflowModalOptions.title = 'Save Draft';
      self.workflowModalOptions.fields = self.appService.countChangedFields(self.value, self.form.getRawValue()) + ' fields';
    } else {
      self.workflowModalOptions.title = 'Save Draft';
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
          if (self.tempState) {
            self.form.get(self.stateModelAttr).patchValue(self.tempState);
          }
          self.tempState = null;
          self.submitValue(reset, true);
        } else {
          self.draftReqInProgress = false;
          self.showLazyLoader = false;
        }
      },
      dismiss => {
        self.showLazyLoader = false;
        self.draftReqInProgress = false;
      }
    );
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
        if (self.isEdit) {
          self.workflowModalOptions._id = self.ID;
        }
        self.workflowModalOptions.operation = self.ID && self.isEdit ? 'PUT' : 'POST';
        self.workflowModalOptions.title = 'Save Draft';
        self.workflowModalOptions.fields = self.appService.countChangedFields(self.value, self.form.getRawValue()) + ' fields';
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
              self.buildForm(self.schema, data); //form array patch value will give wrong data
              const payload = {
                remarks: self.workflowModalOptions.remarks,
                attachments: self.workflowUploadedFiles,
                data: self.form.getRawValue()
              };
              self.showLazyLoader = true;
              self.subscriptions['saveDraft'] = self.commonService
                .put('api', this.api + 'utils/workflow/doc/' + self.workflowData._id, payload).subscribe(
                  res => {
                    self.showLazyLoader = false;
                    self.ts.success('Draft saved.');
                    self.afterSubmit(reset);
                  },
                  err => {
                    self.showLazyLoader = false;
                    self.commonService.errorToast(err, 'Unable to save the record, please try again later');
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


  discardDraft(reset?) {
    const self = this;
    self.confirmDiscardModalRef = self.modalService.open(self.confirmDiscardModal, { centered: true });
    self.confirmDiscardModalRef.result.then(
      close => {
        if (close) {
          self.showLazyLoader = true;
          const payload = {
            action: 'Discard',
            ids: [self.workflowData._id]
          };
          self.subscriptions['discardDraft'] = self.commonService
            .put('api', this.api + '/utils/workflow/action', payload)
            // self.subscriptions['discardDraft'] = self.commonService.put('api', this.api+'/utils/workflow/action?id=' + self.workflowData._id, payload)
            .subscribe(
              res => {
                self.showLazyLoader = false;
                self.ts.success('Draft Discarded.');
                self.afterSubmit(reset);
              },
              err => {
                self.showLazyLoader = false;
                self.commonService.errorToast(err, 'Unable to discard the draft, please try again later.');
              }
            );
        }
      },
      dismiss => {
        self.showLazyLoader = false;
      }
    );
  }
  submitDraft(reset?) {
    const self = this;
    self.showLazyLoader = true;
    self
      .simulatePayload()
      .then(data => {
        self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
        if (self.commonService.userDetails.basicDetails.name) {
          self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
        }
        self.workflowModalOptions._id = self.ID;
        self.workflowModalOptions.remarks = null;
        self.workflowUploadedFiles = [];
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
              self.buildForm(self.schema, data); //form array patch value will give wrong data
              const payload1 = {
                remarks: self.workflowModalOptions.remarks,
                attachments: self.workflowUploadedFiles,
                data: self.form.getRawValue()
              };
              self.subscriptions['saveSubmitDraft'] = self.commonService
                .put('api', this.api + '/utils/workflow/doc/' + self.workflowData._id, payload1).subscribe(
                  res1 => {
                    const payload2 = {
                      action: 'Submit',
                      remarks: self.workflowModalOptions.remarks,
                      attachments: self.workflowUploadedFiles,
                      ids: [self.workflowData._id]
                    };
                    // self.subscriptions['submitDraft'] = self.commonService.put('api', this.api+'/utils/workflow/action?id=' + self.workflowData._id, payload2)
                    self.subscriptions['submitDraft'] = self.commonService
                      .put('api', this.api + '/utils/workflow/action', payload2).subscribe(
                        res2 => {
                          self.showLazyLoader = false;
                          self.ts.success('Draft submitted.');
                          self.afterSubmit(reset);
                          // self.submitWorkflowFiles(reset);
                        },
                        err => {
                          self.showLazyLoader = false;
                          self.commonService.errorToast(err, 'Unable to submit record, please try again later.');
                        }
                      );
                  },
                  err => {
                    self.showLazyLoader = false;
                    self.commonService.errorToast(err, 'Unable to submit record, please try again later.');
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

  save(reset?) {
    const self = this;
    self.reqInProgress = true;
    if (self.hasWorkflow) {
      self
        .simulatePayload()
        .then(data => {
          self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
          if (self.commonService.userDetails.basicDetails.name) {
            self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
          }
          if (self.isEdit) {
            self.workflowModalOptions._id = self.ID;
          }
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
                if (self.tempState) {
                  self.form.get(self.stateModelAttr).patchValue(self.tempState);
                  self.tempState = null;
                }
                self.submitValue(reset);
              }
            },
            dismiss => {
            }
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
      Object.keys(self.form.controls).forEach(key => {
        self.form.controls[key].markAsDirty();
      });
      return;
    }
    self.showLazyLoader = true;
    let payload;
    if (!self.isSchemaFree) {
      payload = self.appService.cloneObject(self.form.getRawValue());
      Object.keys(payload).forEach(item => {
        if (Array.isArray(payload[item]) && payload[item].length === 0) {
          payload[item] = null;
        }
      });
      self.appService.cleanPayload(payload, self.definition, self.isEdit);
    } else {
      payload = this.schemaFreeCode ? this.schemaFreeCode : {};
    }
    let response;
    if (self.hasWorkflow) {
      payload._workflow = {
        audit: [
          {
            by: 'user',
            id: this.commonService.userDetails._id,
            action: draft ? 'Draft' : 'Submit',
            remarks: self.workflowModalOptions.remarks,
            timestamp: Date.now(),
            attachments: self.workflowUploadedFiles
          }
        ]
      };
    }
    if (self.isEdit) {
      let url = self.api + '/' + self.ID;
      if (draft) {
        url += '?draft=true';
      }
      response = self.commonService.put('api', url, payload);
    } else {
      let url = self.api;
      if (draft) {
        url += '?draft=true';
      }
      response = self.commonService.post('api', url, payload);
    }
    self.subscriptions['saveRecord'] = response.subscribe(
      res => {
        // if (res._workflow) {
        //   self.workflowData = { _id: res._workflow };
        //   self.submitWorkflowFiles(reset, draft);
        // } else if (draft) {
        //   self.submitWorkflowFiles(reset, draft);
        // } else {
        self.commonService.fewDocumentsMap[self.api] = null;
        self.showLazyLoader = false;
        self.reqInProgress = false;
        self.draftReqInProgress = false;
        if (res._workflow && !self.isSchemaFree) {
          self.ts.success('Work item submitted for review.');
        } else {
          self.ts.success('Saved.');
        }
        self.afterSubmit(reset);
        // }
      },
      err => {
        self.showLazyLoader = false;
        self.reqInProgress = false;
        self.draftReqInProgress = false;
        self.commonService.errorToast(err, 'Oops, something went wrong.');
      }
    );
  }

  simulatePayload() {
    const self = this;
    const payload = self.appService.cloneObject(self.form.value);
    if (self.isEdit) {
      payload._id = self.ID;
    }
    self.appService.cleanPayload(payload, self.definition, self.isEdit);
    let url = self.api + '/utils/simulate';
    if (self.isEdit || (self.workflowData && self.workflowData.operation === 'PUT')) {
      url = url + '?operation=PUT&generateId=false&source=Document Update Request';
    } else {
      url = url + '?operation=POST&generateId=false&source=Document Create Request';
    }
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
      if (self.stateModelAttr && self.initialState && self.form.get(self.stateModelAttr)) {
        self.form.get(self.stateModelAttr).patchValue(self.initialState);
      }
      self.schemaFreeCode = null;
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
    return self.commonService.hasPermission(self.schema._id, self.schema.role.roles, method);
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

  submitWorkflowFiles(reset, isDraft?) {
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
    self.subscriptions['updateWorkflow'] = self.commonService
      .put('api', this.api + '/utils/workflow/' + self.workflowData._id, payload).subscribe(
        res => {
          self.showLazyLoader = false;
          self.reqInProgress = false;
          self.draftReqInProgress = false;
          self.ts.success('Work item submitted for review.');
          self.afterSubmit(reset);
        },
        err => {
          self.showLazyLoader = false;
          self.reqInProgress = false;
          self.draftReqInProgress = false;
          self.afterSubmit(reset);
        }
      );
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
            tempValue = self.createData(tempValue, res.data, oldValDef);
            const tempDef = self.formService.parseDefinition(self.schema, tempValue, { isEdit: self.isEdit });
            self.form = self.fb.group(self.formService.createForm(tempDef));
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
      if (element.type === 'Object' && !element.properties.schemaFree) {
        this.createData(oldData[element.key], newData[element.key], element.definition);
      }
      if (this.isEdit) {
        if (newData && newData.hasOwnProperty(element.key) && !element.properties.createOnly) {
          oldData[element.key] = newData[element.key];
        }
      } else if (newData && newData.hasOwnProperty(element.key)) {
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
        if (collectionType === 'Object' && !attribute.definition[0].properties.schemaFree) {
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
        self.pageChangeModalTemplateRef = self.modalService.open(self.pageChangeModalTemplate, { centered: true });
        self.pageChangeModalTemplateRef.result.then(close => {
          resolve(close);
        }, dismiss => {
          resolve(false);
        });
      });
    }
    return true;

  }

  get showSubHeader() {
    const self = this;
    const action = self.wizard && self.wizard.length > 0 ? self.wizard[self.currentStep].actions : [];
    if (action.length > 0 || self.stateModelAttr) {
      return true;
    }
    return false;
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

  get searchingRecord() {
    return this.appService.searchingRecord;
  }

  get hasWorkflow() {
    if (this.schema) {
      return this.commonService.hasWorkflow(this.schema)
    }
    return false;
  }

  disableState(statusArray) {
    if (!this.ID) {
      return true
    }
    if (statusArray?.length === 1 && this.currentState === statusArray[0]) {
      return true
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
