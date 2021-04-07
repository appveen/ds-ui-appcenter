import { Component, OnInit } from '@angular/core';
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
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }

  getServices() {
    const filter: any = { app: this.commonService.app._id, 'role.roles.operations': { $elemMatch: { method: 'REVIEW' } } };
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
      .get('sm', '/service', options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        this.showLazyLoader = false;
        if (res.length > 0) {
          this.records = res;
          if (!this.activeId) {
            this.loadWorkflow(res[0]);
          }
        } else {
          this.router.navigate(['/', this.commonService.app._id, 'no-services']);
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

  loadWorkflow(workflow: any, force?: boolean) {
    if(force) {
      this.router.navigateByUrl(['', this.commonService.app._id, 'workflow'].join('/')).then(() => {
        this.router.navigate(['/', this.commonService.app._id, 'workflow', workflow._id]);
      });
    } else {
      this.router.navigate(['/', this.commonService.app._id, 'workflow', workflow._id]);
    }
  }
}
