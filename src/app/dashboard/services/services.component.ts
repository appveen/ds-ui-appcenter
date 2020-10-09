import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { OrderByPipe } from 'src/app/pipes/order-by.pipe';

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
  constructor(private router: Router,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private appService: AppService,
    private orderBy: OrderByPipe) {
    const self = this;
    self.subscriptions = {};
  }

  ngOnInit() {
    const self = this;
    self.getServices();
    self.subscriptions['appChange'] = self.appService.appChange.subscribe(data => {
      self.getServices(true);
    });
    self.route.params.subscribe(params => {
      if (!params || !params.serviceId) {
        self.serviceToRedirect = self.appService.preferredServiceId || self.serviceToRedirect;
        const waitForServiceFetch = setInterval(() => {
          if (self.serviceToRedirect || self.noServices) {
            if (self.serviceToRedirect) {
              self.appService.serviceId = self.serviceToRedirect;
              self.appService.serviceChange.emit({ _id: self.serviceToRedirect });
              self.router.navigate([self.serviceToRedirect, 'list'], {
                relativeTo: self.route
              });
            } else {
              self.router.navigate(['/~/no-services']);
            }
            clearInterval(waitForServiceFetch);
          }
        }, 100);
      } else {
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
    self.subscriptions['getServices'] = self.commonService.get('sm', '/service', options).subscribe(res => {
      self.fetchingServices = false;
      if (res.length === 0) {
        self.noServices = true;
      } else {
        res = self.orderBy.transform(res, 'name');
        self.serviceToRedirect = self.appService.preferredServiceId || res[0]._id;
        if (redirect) {
          if (self.serviceToRedirect) {
            self.appService.serviceId = self.serviceToRedirect;
            self.appService.serviceChange.emit({ _id: self.serviceToRedirect });
            self.router.navigate(['/~/services', self.serviceToRedirect, 'list']);
          }
        }
      }
    }, err => {
      self.fetchingServices = false;
      if (err.status === 403) {
        self.router.navigate(['/~/no-access']);
      } else {
        self.commonService.errorToast(err, 'Unable to fetch service records please try again later');
      }
    });
  }
}
