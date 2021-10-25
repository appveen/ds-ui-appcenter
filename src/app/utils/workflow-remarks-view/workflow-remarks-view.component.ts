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
  constructor(public activeModal: NgbActiveModal,
    public commonService: CommonService) { }

  ngOnInit(): void {
    if (!environment.production) {
      console.log(this.workflowData);
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

  get submitRemarks() {
    if (this.workflowData && this.workflowData.audit) {
      return this.workflowData.audit.find(e => e.action === 'Submit');
    }
    return null;
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
}
