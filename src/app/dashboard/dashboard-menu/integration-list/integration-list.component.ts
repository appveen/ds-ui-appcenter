import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { DashboardService } from '../../dashboard.service';

@Component({
  selector: 'odp-integration-list',
  templateUrl: './integration-list.component.html',
  styleUrls: ['./integration-list.component.scss']
})
export class IntegrationListComponent implements OnInit {

  subscriptions: any;
  showLazyLoader: boolean;
  records: Array<any>;
  activeId: string;
  searchText: string;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private router: Router) {
    this.subscriptions = {};
    this.records = [];
  }

  ngOnInit(): void {
    this.setActiveId(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveId(event.url)
    });
    this.getPartners();
    this.dashboardService.appChanged.subscribe(app => {
      this.getPartners();
    });
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }

  getPartners() {
    const options: GetOptions = {
      count: -1,
      select: 'name,app',
      sort: 'name',
      filter: {
        app: this.commonService.app._id
      }
    };
    this.showLazyLoader = true;
    if (this.subscriptions.getPartners) {
      this.subscriptions.getPartners.unsubscribe();
    }
    this.subscriptions.getPartners = this.commonService.get('pm', '/partner', options).subscribe(res => {
      this.showLazyLoader = false;
      this.records = res;
      if (!this.activeId) {
        this.loadPartnerInteractions(null);
      }
    }, err => {
      console.error(err);
      this.showLazyLoader = false;
    });
  }

  loadPartnerInteractions(interactionItem?: any) {
    if (interactionItem && interactionItem._id) {
      this.appService.partnerId = interactionItem._id;
      this.router.navigate(['/', this.commonService.app._id, 'interactions',interactionItem._id]);
    } else {
      this.appService.partnerId = null;
      this.router.navigate(['/', this.commonService.app._id, 'interactions','all']);
    }
  }

}
