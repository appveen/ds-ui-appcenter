import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { WorkflowService } from 'src/app/dashboard/workflow/workflow.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'odp-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
  animations: [
    trigger('slide', [
      state('focus', style({
        left: '10px'
      })),
      transition('blur <=> focus', [
        animate('300ms cubic-bezier(0.86, 0, 0.07, 1)')
      ])
    ])
  ]
})
export class WorkflowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  subscriptions: any;
  workflows: Array<any>;
  selectedWorkflowItem: any;
  noWorkflow: boolean;
  loading: any;
  wfName: string;
  serviceList: Array<any>;

  constructor(private commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute,
    private wfService: WorkflowService,
  ) {
    const self = this;
    self.subscriptions = {};
    self.workflows = [];
    self.selectedWorkflowItem = {};
    self.loading = {};
    self.wfName = '';
    self.serviceList = [];
  }

  ngOnInit() {
    const self = this;
    self.getServiceList();
    self.subscriptions['navigateToWorkflow'] = self.appService.navigateToWorkflow
      .subscribe((id) => {
        if (self.workflows && self.workflows.length > 0) {
          if (id) {
            self.selectedWorkflowItem = self.workflows.find(e => e._id === id);
          } else {
            self.selectWorkflow(self.workflows[0]);
          }
        } else {
          self.noWorkflow = true;
        }
      });
    self.appService.workflowStatus.subscribe(res => {
      if (res) {
       
        self.getServiceList();
      }
    });
    self.appService.appChange.subscribe(() => {
      self.noWorkflow = false;
      self.serviceList = [];
      self.workflows = [];
      self.getServiceList();
    });
  }


  ngAfterViewInit() {
    const self = this;
    // self.searchInput.nativeElement.focus();
  }
  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
    self.appService.workflowTab = null;
  }

  getServiceList() {
    const self = this;
    self.loading.workflows = true;
    const options = {
      filter: {
        app: self.commonService.app._id,
        status: 'Pending'
      }
    };
    self.subscriptions['getWorkflowsByServices'] = self.commonService
      .get('wf', '/serviceList', options)
      .subscribe(res => {
        if (res && res.length > 0) {
          res.forEach(element => {
            self.serviceList.push({
              _id: element.serviceId,
              pending: true,
              count: element.count
            });
          });
        }
        self.loading.workflows = false;
        self.getNonPendingServices();
      }, err => { self.loading.workflows = false; });
  }
  getNonPendingServices() {
    const self = this;
    self.loading.workflows = true;

    self.subscriptions['getWorkflowsByServices'] = self.commonService
      .get('wf', '/serviceList', {
        filter: {
          app: self.commonService.app._id,
          status: { $ne: 'Pending' }
        }
      })
      .subscribe(res => {
        if (res && res.length > 0) {
          res.forEach(element => {
            const index = self.serviceList.findIndex(ele => ele._id === element.serviceId);
            if (index < 0) {
              self.serviceList.push({
                _id: element.serviceId,
                pending: false,
                count: element.count

              });
            }
          });
        }
        self.loading.workflows = false;
        self.getWorkflowsByServices();

      }, err => { self.loading.workflows = false; });
  }

  getWorkflowsByServices() {
    const self = this;
    self.loading.workflows = true;
    self.workflows = self.serviceList;
    if (self.serviceList && self.serviceList.length > 0) {
      self.serviceList.forEach(wf => {
        self.getServiceDetails(wf._id, (res) => {
          if (res) {
            wf.name = res.name;
            wf.status = res.status;
          }
        });
      });
      self.selectWorkflow(self.workflows[0]);
    } else {
      self.noWorkflow = true;
    }
    self.loading.workflows = false;
  }


  getWhenCreated(dateStr) {
    const self = this;
    return self.appService.getWhenCreated(dateStr);
  }

  countType(arr: Array<any>, type: string) {
    const self = this;
    return arr.filter(e => e.operation === type).length;
  }

  selectWorkflow(wfItem) {
    const self = this;
    self.selectedWorkflowItem = wfItem;
    self.appService.workflowId = wfItem._id;
    self.router.navigate([wfItem._id], { relativeTo: self.route });
  }

  getServiceDetails(id, callback) {
    const self = this;
    if (self.subscriptions['getRecordsCount']) {
      self.subscriptions['getRecordsCount'].unsubscribe();
    }
    self.subscriptions['getServiceDetails'] = self.commonService
      .get('sm', '/service/' + id)
      .subscribe(res => {
        self.wfService.serviceColumns.push({ 'id': res._id, 'attrs': res.attributeList });
        callback(res);
      }, err => {
        callback(null);
      });
  }

  pendingWF(wf) {
    return wf.wf.find(e => e.status === 'Pending');
  }
}
