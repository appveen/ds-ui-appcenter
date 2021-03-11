import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { FormControl, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { CommonService } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/service/app.service';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'odp-workflow-respond-view',
  templateUrl: './workflow-respond-view.component.html',
  styleUrls: ['./workflow-respond-view.component.scss'],
  animations: [trigger('cardAction', [
    state('void', style({
      bottom: 0,
      left: 0,
      right: 0
    })),
    transition('void => *', [
      animate('200ms ease-in', keyframes([
        style({
          opacity: 0
        }),
        style({
          opacity: 1
        })
      ]))
    ]),
    transition('* => void', [
      animate('200ms ease-out', keyframes([
        style({
          opacity: 1
        }),
        style({
          opacity: 0
        })
      ]))
    ])
  ])]
})
export class WorkflowRespondViewComponent implements OnInit, OnDestroy {
  @ViewChild('inputBox', { static: false }) ele: ElementRef;
  @Input() showCard: any;
  @Input() presentAudit: any;
  @Input() selectedData: any;
  @Input() approversList: Array<any>;
  @Input() ids: Array<any>;
  @Input() isWorkflowViewPage: boolean;
  @Input() requestedByList: Array<any>;
  @Input() serviceStatus: any;
  @Input() workflowApi: string;
  @Output() actionResponse: EventEmitter<any>;

  dataToRespond: Array<any>;
  respondAnimation;
  showLazyLoader: boolean;
  actionClicked: boolean;
  respondModalOptions: any;
  @Input() workflowUploadedFiles: Array<any>;
  subscriptions: any;
  @Input() workflowFilesList: Array<any>;
  actionObj: any;
  actionArray: any;
  focused: boolean;
  @Input() respondControl: FormControl;

  constructor(
    private commonService: CommonService,
    private appService: AppService,
    private ts: ToastrService,
    private router: Router,
  ) {
    const self = this;
    self.respondAnimation = {};
    self.actionResponse = new EventEmitter();
    self.respondModalOptions = {};
    self.workflowUploadedFiles = [];
    self.subscriptions = {};
    self.workflowFilesList = [];
    self.actionObj = {
      approve: false,
      reject: false,
      rework: false,
    };
    self.actionArray = {
      Submit: 'Pending Review',
      Approved: 'Approved',
      Rejected: 'Rejected',
      SentForRework: 'Rework',
      Draft: 'Draft',
      Discard: 'Discard',
      'Save & Submit': 'Pending Review',
      Edit: 'Draft'
    };
    self.dataToRespond = [];

  }

  ngOnInit() {
    const self = this;
    self.getAuditUser();
    if (self.showCard) {
      self.respondAnimation['card'] = true;
    }

    self.subscriptions['showWorkflowDocument'] = self.appService.showWorkflowDocument.pipe(filter(data => !!data.data)).subscribe(data => {
      self.dataToRespond = !!data.multi ? data.selectedRecords : [data.data];
      self.selectedData = data.data;
      self.getAuditUser();
    });
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(key => {
      this.subscriptions[key].unsubscribe();
    })
  }

  getAuditUser() {
    const self = this;
    if (self.selectedData) {
      self.selectedData.audit.forEach(element => {
        self.commonService.getUser(element.id).then(user => {
          element.userName = user.basicDetails.name ? user.basicDetails.name : element.id;
        }).catch(err => {
          element.userName = element.id;
        });
      });
    }
  }

  expandWflist(canCloseView?, refereshRequired?) {
    const self = this;
    self.respondAnimation['card'] = !self.respondAnimation['card'];
    self.actionResponse.emit({
      canCloseView: canCloseView,
      refereshRequired: refereshRequired
    });
  }

  closeRespondView() {
    const self = this;
    if (!self.showLazyLoader) {
      self.actionResponse.emit({
        respondControl: self.respondControl.value
      });
    }
  }

  get requiredError() {
    const self = this;
    return self.respondControl.hasError('required') && self.respondControl.touched;
  }

  createControl(type) {
    const self = this;
    self.actionClicked = !self.actionClicked;
    self.actionObj[type] = true
    const value = self.respondControl.value
    if (type !== 'approve') {
      self.respondControl = new FormControl('', Validators.required);
    } else {
      self.respondControl = new FormControl();
    }
    self.respondControl.patchValue(value);
  }
  onBlur() {
    const self = this;
    if (self.respondControl.valid) {
      self.focused = false;
    }
    if (self.respondControl.invalid) {
      self.ele.nativeElement.focus();
    }

  }
  respond(action: string) {
    const self = this;
    self.showLazyLoader = true;
    self.respondControl.markAllAsTouched();
    if (self.respondControl.invalid) {
      self.ele.nativeElement.focus();
      self.showLazyLoader = false;
      return;
    }
    const payload = {
      action,
      remarks: self.respondControl.value,
      attachments: self.workflowUploadedFiles,
      ids: self.dataToRespond.map(data => data._id)
    };
    self.subscriptions['respond'] = self.commonService.put('api', this.workflowApi + '/action', payload)
      .subscribe(res => {
        if (res && res.failed && res.failed.length) {
          self.ts.warning(res.passed.length + ' records passed and ' + res.failed.length + ' records failed');
        } else if (res.passed) {
          self.ts.success(res.passed.length + ' records passed');
        } else if (res.message) {
          self.ts.success(res.message);
        }
        self.appService.workflowStatus.emit(true);
        self.expandWflist(true, true);
        self.showLazyLoader = false;
      }, err => {
        self.showLazyLoader = false;
        if (err.error) {
          if (err.error && err.error.failed && err.error.failed.length && err.error.passed && err.error.passed.length) {
            self.ts.warning(err.error.passed.length + ' records passed and ' + err.error.failed.length + ' records failed');
          } else if (err.error.passed && err.error.passed.length) {
            self.ts.success(err.passed.length + ' records passed');
          } else if (err.error.failed && err.error.failed.length) {
            if (err.error.failed.length === 1 && err.error.failed[0].message.code) {
              self.ts.error(err.error.message);
            }
            if (err.error.failed.length === 1 && !err.error.failed[0].message.code) {
              self.ts.error(err.error.failed[0].message.message);
            } else {
              self.ts.error(err.error.failed.length + ' records failed');
            }
            // self.ts.error(err.error.message);
          } else {
            self.commonService.errorToast(err, 'Unable to respond to the workflow,please try again later');
          }
          self.appService.workflowStatus.emit(true);
          self.router.navigate(['/', this.commonService.app._id, 'workflow', self.appService.serviceId]);

        } else {
          self.commonService.errorToast(err, 'Unable to respond to the workflow,please try again later');
        }
        self.expandWflist(true, true);
      });
  }

  uploadWorkflowFile(_event) {
    const self = this;
    const file = _event.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);
    const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
    if (indexOfValue < 0) {
      self.showLazyLoader = true;
      self.subscriptions['uploadFile_' + file.name] = self.commonService
        .upload('api', this.appService.serviceAPI, formData, false)
        .subscribe(event => {
          if (event.type === HttpEventType.UploadProgress) {
            // self.processing.progress = Math.floor(event.loaded / event.total * 100);
          }
          if (event.type === HttpEventType.Response) {
            self.showLazyLoader = false;
            if (self.workflowFilesList.length === 0) {
              self.workflowFilesList.push(file);
            } else {
              const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
              if (indexOfValue < 0) {
                self.workflowFilesList.push(file);
              }
            }
            // self.processing.progressBar = false;
            self.workflowUploadedFiles.push(event.body);
            _event.target.value = '';
          }
        }, err => {
          self.showLazyLoader = false;
          self.commonService.errorToast(err, 'Unable to upload the file please try again later.');
        });
    }
  }
  removeWorkflowFile(index: number) {
    const self = this;
    self.workflowUploadedFiles.splice(index, 1);
    self.workflowFilesList.splice(index, 1);
  }

  get allCheckedRecords() {
    const self = this;
    return !!self.dataToRespond ? self.dataToRespond.length : 0;
  }

  downloadFile(_id) {
    const self = this;
    window.open(environment.url.api + self.appService.serviceAPI + '/utils/file/download/' +_id);
  }

  get canRespond() {
    const self = this;
    let flag = false;
    let audit;
    if (self.selectedData && self.selectedData.audit) {
      audit = self.selectedData.audit[self.selectedData.audit.length - 1];
    }
    if (self.selectedData && self.selectedData.requestedBy !== self.commonService.userDetails._id) {
      flag = true;
    }
    if (audit && audit.id !== self.commonService.userDetails._id && audit.action !== 'Error') {
      flag = true;
    }
    if (self.selectedData && self.selectedData.status !== 'Pending') {
      flag = false;
    }
    if (!self.approversList.find(e => e === self.commonService.userDetails._id)) {
      flag = false;
    }
    if (self.serviceStatus !== 'Active') {
      flag = false;
    }
    // if (self.ids && self.ids.length > 1) {
    //   flag = true;
    // }
    return flag;
  }
  resetAction() {
    const self = this;
    self.actionClicked = !self.actionClicked;
    self.actionObj = {
      approve: false,
      reject: false,
      rework: false,
    };
    self.focused = false;
    // self.workflowFilesList = [];
    // self.workflowUploadedFiles = [];
  }
  getDateFormat(val) {
    return new Date(val).toISOString();
  }
  getUserName(id) {
    const self = this;
    const user = self.requestedByList.find(e => e._id === id);
    if (user) {
      return user.name;
    } else {
      return null;
    }
  }
}
