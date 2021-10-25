import { HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-workflow-respond-view',
  templateUrl: './workflow-respond-view.component.html',
  styleUrls: ['./workflow-respond-view.component.scss']
})
export class WorkflowRespondViewComponent implements OnInit {

  @Input() title: string;
  @Input() workflowData: any;
  @Input() serviceData: any;
  @Input() actions: Array<string>;
  workflowFilesList: Array<any>;
  workflowUploadedFiles: Array<any>;
  remarks: string;
  fileProgress: any;
  showLazyLoader: boolean;
  actionMap: any;
  constructor(public activeModal: NgbActiveModal,
    public commonService: CommonService,
    public ts: ToastrService) {
    this.workflowFilesList = [];
    this.workflowUploadedFiles = [];
    this.fileProgress = {};
    this.actions = ['discard', 'submit', 'rework', 'approve', 'reject'];
    this.actionMap = {
      'discard': 'Discard',
      'submit': 'Submit',
      'rework': 'Rework',
      'approve': 'Approve',
      'reject': 'Reject'
    }
  }

  ngOnInit(): void {
    if (!environment.production) {
      console.log(this.actions);
      console.log(this.workflowData);
    }
    if (!this.title) {
      this.title = this.workflowData?._id;
    }
    if (!this.actions || this.actions.length == 0) {
      this.actions = ['discard', 'submit', 'rework', 'approve', 'reject'];
    }
  }

  close(type: string) {
    this.activeModal.close(this.workflowData);
  }

  dismiss() {
    this.activeModal.close(false);
  }

  stepRemarks(item) {
    if (this.workflowData && this.workflowData.audit) {
      return this.workflowData.audit.filter(e => e.action === item.name);
    }
    return [];
  }

  isCurrentStep(item) {
    if (this.workflowData && item.name === this.workflowData.checkerStep) {
      return true;
    }
    return false;
  }

  uploadWorkflowFile(ev) {
    const file = ev.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);
    const indexOfValue = this.workflowFilesList.findIndex(val => val.name === file.name);
    if (indexOfValue < 0) {
      this.commonService
        .upload('api', this.api, formData, false).subscribe(
          event => {
            if (event.type === HttpEventType.UploadProgress) {
              this.fileProgress[file.name] = Math.floor(event.loaded / event.total * 100);
            }
            if (event.type === HttpEventType.Response) {
              this.workflowFilesList.push(file);
              this.workflowUploadedFiles.push(event.body);
            }
          },
          err => {
            this.commonService.errorToast(err, 'Unable to upload the file, please try again later.');
          }
        );
    }
    ev.target.value = '';
  }

  removeWorkflowFile(index: number) {
    this.workflowUploadedFiles.splice(index, 1);
    this.workflowFilesList.splice(index, 1);
  }

  respond(action: string) {
    this.showLazyLoader = true;
    const payload = {
      action,
      remarks: this.remarks,
      attachments: this.workflowUploadedFiles,
      ids: [this.workflowData._id],
      data: this.workflowData.data.new
    };
    this.commonService.put('api', `${this.api}/utils/workflow/action`, payload)
      .subscribe((res: any) => {
        this.showLazyLoader = false;
        if (!environment.production) {
          console.log(res);
        }
        let temp: any = res.results;
        if (Array.isArray(res.results)) {
          temp = res.results[0];
        }
        if (temp.status == 200) {
          this.ts.success(temp.message);
        } else {
          this.ts.warning(temp.message);
        }
        this.activeModal.close({ status: 200, data: temp });
      }, err => {
        this.showLazyLoader = false;
        this.commonService.errorToast(err);
        console.log(err);
        this.activeModal.close({ status: 400, data: err });
      });
  }

  saveDraft() {
    this.showLazyLoader = true;
    const payload = {
      remarks: this.remarks,
      attachments: this.workflowUploadedFiles,
      ids: [this.workflowData._id],
      data: this.workflowData.data.new
    };
    this.commonService
      .put('api', `${this.api}/utils/workflow/doc/${this.workflowData._id}`, payload).subscribe(res => {
        this.showLazyLoader = false;
        this.ts.success('Draft saved.');
        this.activeModal.close({ status: 200, data: res });
      }, err => {
        this.showLazyLoader = false;
        this.commonService.errorToast(err, 'Unable to save the draft, please try again later');
        console.log(err);
        this.activeModal.close({ status: 400, data: err });
      });
  }

  get hasSubmit() {
    return (this.actions || []).indexOf('submit') > -1;
  }

  get hasSaveDraft() {
    return (this.actions || []).indexOf('saveDraft') > -1;
  }

  get hasDiscardDraft() {
    return (this.actions || []).indexOf('discard') > -1;
  }

  get hasApprove() {
    return (this.actions || []).indexOf('approve') > -1 && this.canRespond;
  }

  get hasRework() {
    return (this.actions || []).indexOf('rework') > -1 && this.canRespond;
  }

  get hasRevert() {
    return (this.actions || []).indexOf('revert') > -1 && this.canRespond;
  }

  get hasReject() {
    return (this.actions || []).indexOf('reject') > -1 && this.canRespond;
  }

  get workflowSteps() {
    if (this.serviceData && this.serviceData.workflowConfig && this.serviceData.workflowConfig.makerCheckers && this.serviceData.workflowConfig.makerCheckers[0]) {
      return this.serviceData.workflowConfig.makerCheckers[0].steps;
    }
    return [];
  }

  get canRespond() {
    let audit;
    if (this.workflowData && this.workflowData.audit) {
      audit = this.workflowData.audit[this.workflowData.audit.length - 1];
    }
    if (this.workflowData.requestedBy == this.commonService.userDetails._id) {
      return false;
    }
    if (audit && audit.id == this.commonService.userDetails._id) {
      return false;
    }
    if (this.workflowData.status !== 'Pending') {
      return false;
    }
    if (!this.commonService.canRespondToWF(this.serviceData, this.workflowData.checkerStep)) {
      return false;
    }

    if (this.serviceData.status !== 'Active') {
      return false;
    }
    return true;
  }

  get api() {
    if (this.serviceData && this.serviceData.api) {
      return '/' + this.commonService.app._id + this.serviceData.api;
    }
    return '';
  }
}
