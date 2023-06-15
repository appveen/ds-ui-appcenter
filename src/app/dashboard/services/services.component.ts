import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { OrderByPipe } from 'src/app/pipes/order-by.pipe';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import * as _ from 'lodash'


@Component({
  selector: 'odp-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  providers: [OrderByPipe]
})
export class ServicesComponent implements OnInit, OnDestroy {

  fetchingServices: boolean;
  noServices: boolean;
  private subscriptions: any;
  private serviceToRedirect: string;
  breadcrumb: any;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private appService: AppService,
    private orderBy: OrderByPipe,
    private shortcutsService: ShortcutService) {
    const self = this;
    self.subscriptions = {};
    this.route.data.subscribe(data => {
      if (data.breadcrumb) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
        this.commonService.breadcrumbPush(this.breadcrumb)
      }
    })
  }

  ngOnInit() {
    const self = this;
    self.getServices(true);
    self.subscriptions['appChange'] = self.appService.appChange.subscribe(data => {
      self.getServices(true);
    });
    self.route.params.subscribe(params => {
      if (!!params?.serviceId) {
        self.serviceToRedirect = params.serviceId;
        self.appService.serviceId = self.serviceToRedirect;
        self.appService.serviceChange.emit({ _id: self.serviceToRedirect });
        if (!self.router.url.match(/(list|manage|view)/)) {
          self.router.navigate(['list'], {
            relativeTo: self.route
          });
        }
      }
    });
    this.shortcutsService.unregisterAllShortcuts();
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  getServices(redirect?: boolean) {
    const self = this;
    const filter = { status: 'Active', app: self.commonService.app._id };
    if (!self.commonService.userDetails.isSuperAdmin
      && self.commonService.servicesWithAccess.length > 0) {
      filter['_id'] = {
        '$in': self.commonService.servicesWithAccess
      };
    }
    const options: GetOptions = {
      count: 10,
      filter: filter,
      select: '_id,name,app'
    };
    self.fetchingServices = true;
    if (self.subscriptions['getServices']) {
      self.subscriptions['getServices'].unsubscribe();
    }
    self.subscriptions['getServices'] = self.commonService.get('sm', `/${this.commonService.app._id}/service`, options).subscribe(res => {
      self.fetchingServices = false;
      if (res.length === 0) {
        self.noServices = true;
        self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
          state: {
            noRedirect: true,
            serviceId: null
          }
        });
      } else {
        res = self.orderBy.transform(res, 'name');
        if (redirect) {
          if (self.serviceToRedirect) {
            self.appService.serviceId = self.serviceToRedirect;
            self.appService.serviceChange.emit({ _id: self.serviceToRedirect });
            if (!self.router.url.match(/(list|manage|view)/)) {
              self.router.navigate(['/', this.commonService.app._id, 'services', self.serviceToRedirect, 'list']);
            }
          }
        }
      }
    }, err => {
      self.fetchingServices = false;
      if (err.status === 403) {
        self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
          state: {
            noRedirect: true,
            serviceId: null
          }
        });
      } else {
        self.commonService.errorToast(err, 'Unable to fetch service records please try again later');
      }
    });
  }
}
