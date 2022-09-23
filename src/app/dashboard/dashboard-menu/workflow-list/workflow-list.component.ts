import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { DashboardService } from '../../dashboard.service';

@Component({
  selector: 'odp-workflow-list',
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.scss']
})
export class WorkflowListComponent implements OnInit {

  subscriptions: any;
  showLazyLoader: boolean;
  records: Array<any>;
  activeId: string;
  searchText: string;
  serviceDocsCount: any;
  @Output() toggleWorkflow: EventEmitter<any> = new EventEmitter();

  constructor(private appService: AppService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private router: Router) {
    this.subscriptions = {};
    this.records = [];
    this.serviceDocsCount = {};
  }

  ngOnInit(): void {
    this.setActiveId(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveId(event.url)
    });
    this.getServices();
    this.getWorflowItemsCount();
    this.dashboardService.appChanged.subscribe(app => {
      this.getServices();
      this.getWorflowItemsCount();
    });

    this.appService.workflowStatus.subscribe(status => {
      if (status) {
        this.updateWorflowCount();
      }
    }
    );
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 3) {
      this.activeId = segments[3];
    }
  }

  getServices() {
    const filter: any = { app: this.commonService.app._id, 'workflowConfig.enabled': true };
    if (!this.commonService.userDetails.isSuperAdmin
      && this.commonService.servicesWithAccess.length > 0) {
      filter._id = {
        $in: this.commonService.servicesWithAccess
      };
    }
    const options: GetOptions = {
      count: -1,
      filter,
      select: 'name,app,api',
      sort: 'name'
    };
    this.showLazyLoader = true;
    if (this.subscriptions.getServices) {
      this.subscriptions.getServices.unsubscribe();
    }
    this.subscriptions.getServices = this.commonService
      .get('sm', `/${this.commonService.app._id}/service`, options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        this.showLazyLoader = false;
        if (res.length > 0) {
          this.records = res;
          res.forEach(ele => {
            this.updateWorflowCount(ele)
          })
          if (!this.activeId) {
            this.loadWorkflow(res[0]);
          }
          this.toggleWorkflow.emit(false)
        }
        else {
          this.toggleWorkflow.emit(true)
        }
      }, err => {
        console.error(err);
        this.showLazyLoader = false;
      });
  }

  getWorflowItemsCount() {
    const filter: any = {
      status: 'Pending'
    };
    const options: GetOptions = {
      filter,
    };
    this.showLazyLoader = true;
    if (this.subscriptions.getWorflowItemsCount) {
      this.subscriptions.getWorflowItemsCount.unsubscribe();
    }
    this.subscriptions.getWorflowItemsCount = this.commonService
      .get('wf', `/${this.commonService.getCurrentAppId()}/serviceList`, options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        this.showLazyLoader = false;
        this.serviceDocsCount = res;
      }, err => {
        console.error(err);
        this.showLazyLoader = false;
      });
  }

  loadWorkflowOverview() {
    this.router.navigate(['/', this.commonService.app._id, 'workflow', 'overview']);
    this.getServices()
  }

  loadWorkflow(workflow: any, force?: boolean) {
    if (force) {
      this.updateWorflowCount();
      this.router.navigateByUrl(['', this.commonService.app._id, 'workflow'].join('/')).then(() => {
        this.router.navigate(['/', this.commonService.app._id, 'workflow', workflow._id]);
      });
    } else {
      this.router.navigate(['/', this.commonService.app._id, 'workflow', workflow._id]);
    }
  }


  updateWorflowCount(service?) {
    const serviceApi = service?.api || this.records.filter(record => record._id == this.activeId).map(record => record.api)[0]
    const workflowApi = `/${this.commonService.getCurrentAppId()}${serviceApi}/utils/workflow`;
    const id = service?._id || this.activeId;
    const filter = {
      serviceId: id,
      operation: { $in: ['POST', 'PUT', 'DELETE'] },
      status: 'Pending'
    };
    this.subscriptions['getNewRecordsCount'] = this.commonService
      .get('api', workflowApi + '/count', { filter, serviceId: id })
      .subscribe(count => {
        this.serviceDocsCount[id] = count;
      });
  }
}
