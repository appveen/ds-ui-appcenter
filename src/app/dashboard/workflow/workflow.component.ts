import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { WorkflowService } from 'src/app/dashboard/workflow/workflow.service';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash'


@Component({
  selector: 'odp-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  subscriptions: any;

  activeId: string;
  workflowApi: string;
  breadcrumb: any;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    const self = this;
    self.subscriptions = {};
  }

  ngOnInit() {
    this.setActiveId(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveId(event.url)
    });

    this.route.data.subscribe(data => {
      if (data.breadcrumb) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
        this.commonService.breadcrumbPush(this.breadcrumb)
      }
    })
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }
}
