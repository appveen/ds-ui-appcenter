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

  @Input() workflowData: any;
  @Input() serviceData: any;
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
      console.log(this.workflowData);
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
    console.log(file);
    this.workflowFilesList.push(file);
    // const indexOfValue = this.workflowFilesList.findIndex(val => val.name === file.name);
    // if (indexOfValue < 0) {
    //   this.commonService
    //     .upload('api', this.api, formData, false).subscribe(
    //       event => {
    //         if (event.type === HttpEventType.UploadProgress) {
    //           this.fileProgress[file.name] = Math.floor(event.loaded / event.total * 100);
    //         }
    //         if (event.type === HttpEventType.Response) {
    //           this.workflowFilesList.push(file);
    //           this.workflowUploadedFiles.push(event.body);
    //         }
    //       },
    //       err => {
    //         this.commonService.errorToast(err, 'Unable to upload the file, please try again later.');
    //       }
    //     );
    // }
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
      ids: [this.workflowData._id]
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
        this.activeModal.close(res);
      }, err => {
        this.showLazyLoader = false;
        this.commonService.errorToast(err);
        console.log(err);
        this.activeModal.dismiss(err);
      });
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
