import { Component, OnDestroy, OnInit, Input, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { CommonService, GetOptions } from '../../service/common.service';
import { WorkflowListComponent } from './workflow-list/workflow-list.component';

@Component({
  selector: 'odp-dashboard-menu',
  templateUrl: './dashboard-menu.component.html',
  styleUrls: ['./dashboard-menu.component.scss']
})
export class DashboardMenuComponent implements OnInit, OnDestroy {

  @ViewChild(WorkflowListComponent) wfList: WorkflowListComponent
  @Input() activeId: string;
  subscriptions: any;
  activeMenuKey: string;
  openPanel: any = {
    'pinnedDs': true,
    'ds': true,
    'workflow': false,
    'interaction': false,
  };
  hideWorkflows: boolean;
  hideInteraction: boolean;
  constructor(private router: Router, private commonService: CommonService) {
    this.subscriptions = {};
  }

  ngOnInit() {
    this.setActiveMenu(this.router.url)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveMenu(event.url)
    });
    this.getWorflowItemsCount()
    // this.wfList.getServices()
  }

  ngOnDestroy() {

  }

  getWorflowItemsCount() {
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
    if (this.subscriptions.getServices) {
      this.subscriptions.getServices.unsubscribe();
    }
    this.subscriptions.getServices = this.commonService
      .get('sm', `/${this.commonService.app._id}/service`, options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        if (res.length > 0) {
          this.toggleWorkflow(false)
        }
        else {
          this.toggleWorkflow(true)
        }
      }, err => {
        console.error(err);
      });
  }

  setActiveMenu(url: string) {
    if (url.indexOf('services') > -1) {
      this.activeMenuKey = 'services'
    } else if (url.indexOf('interactions') > -1) {
      this.activeMenuKey = 'interactions'
    } else if (url.indexOf('bookmark') > -1) {
      this.activeMenuKey = 'bookmark'
    } else if (url.indexOf('workflow') > -1) {
      this.activeMenuKey = 'workflow'
    } else {
      this.activeMenuKey = 'INVALID';
    }
  }

  togglePanel(panel) {
    this.openPanel[panel] = !this.openPanel[panel];
  }

  toggleWorkflow(value) {
    this.hideWorkflows = value;
  }
  onStarredAction(event) {
    this.togglePanel(event);
  }
}
