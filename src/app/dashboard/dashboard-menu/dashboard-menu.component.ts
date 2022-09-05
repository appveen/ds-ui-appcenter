import { Component, OnDestroy, OnInit, Input, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { WorkflowListComponent } from './workflow-list/workflow-list.component';

@Component({
  selector: 'odp-dashboard-menu',
  templateUrl: './dashboard-menu.component.html',
  styleUrls: ['./dashboard-menu.component.scss']
})
export class DashboardMenuComponent implements OnInit, OnDestroy {

  @Input() activeId: string;
  @ViewChild(WorkflowListComponent) wfList: WorkflowListComponent
  activeMenuKey: string;
  openPanel: any = {
    'pinnedDs': true,
    'ds': true,
    'workflow': true,
  };
  hideWorkflows: boolean = false;
  constructor(private router: Router) {

  }

  ngOnInit() {
    this.setActiveMenu(this.router.url)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveMenu(event.url)
    });

    // this.wfList.getServices()
  }

  ngOnDestroy() {

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
