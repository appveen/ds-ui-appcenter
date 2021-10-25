import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-workflow-remarks-view',
  templateUrl: './workflow-remarks-view.component.html',
  styleUrls: ['./workflow-remarks-view.component.scss']
})
export class WorkflowRemarksViewComponent implements OnInit {

  @Input() workflowData: any;
  @Input() serviceData: any;
  workflowActions: Array<string>;
  constructor(public activeModal: NgbActiveModal,
    public commonService: CommonService) {
    this.workflowActions = [];
  }

  ngOnInit(): void {
    if (!environment.production) {
      console.log(this.workflowData);
    }
    if (this.serviceData && this.serviceData.workflowConfig && this.serviceData.workflowConfig.makerCheckers && this.serviceData.workflowConfig.makerCheckers[0]) {
      this.workflowActions = this.serviceData.workflowConfig.makerCheckers[0].steps.map(e => e.name);
    }
  }

  close() {
    this.activeModal.close(this.workflowData);
  }

  dismiss() {
    this.activeModal.dismiss(false);
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

  getIconClass(item) {
    if (item.action == 'Draft') {
      return 'border-primary bg-primary text-white';
    } else if (item.action == 'Edit') {
      return 'border-warning bg-warning text-white';
    } else if (item.action == 'Submit' || item.action === 'Save & Submit') {
      return 'border-primary bg-primary text-white';
    } else if (item.action == 'Reject') {
      return 'border-danger bg-danger text-white';
    } else if (item.action == 'Rework') {
      return 'border-dark bg-dark text-white';
    } else if (this.workflowActions.some(e => e === item.action)) {
      return 'border-success bg-success text-white';
    } else {
      return 'bg-light text-dark';
    }
  }

  isWorkflowStep(item) {
    return this.workflowActions.some(e => e === item.action)
  }

  downloadFile(fileId) {
    const self = this;
    window.open(environment.url.api + this.api + '/utils/file/download/' + fileId);
  }

  get submitRemarks() {
    if (this.workflowData && this.workflowData.audit) {
      return this.workflowData.audit.find(e => e.action === 'Submit');
    }
    return null;
  }

  get workflowSteps() {
    if (this.serviceData && this.serviceData.workflowConfig && this.serviceData.workflowConfig.makerCheckers && this.serviceData.workflowConfig.makerCheckers[0]) {
      let temp = this.serviceData.workflowConfig.makerCheckers[0].steps;
      return temp.filter(e => !this.workflowData.audit.some(ae => ae.action == e.name));
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
