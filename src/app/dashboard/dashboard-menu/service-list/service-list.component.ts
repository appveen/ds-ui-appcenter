import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import * as _ from 'lodash';

import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { DashboardService } from '../../dashboard.service';

@Component({
  selector: 'odp-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.scss']
})
export class ServiceListComponent implements OnInit {
  subscriptions: any;
  showLazyLoader: boolean;
  records: Array<any>;
  pinnedDs: Array<any>;
  activeId: string;
  prefId: string;
  preference: any;
  searchText: string;
  @Input() dsType: string;
  @Output() onStarredAction: EventEmitter<any> = new EventEmitter();

  constructor(public appService: AppService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private router: Router) {
    this.subscriptions = {};
    this.records = [];
    this.pinnedDs = [];
  }

  ngOnInit(): void {
    this.setActiveId(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveId(event.url)
    });
    this.getPreferences();
    this.dashboardService.appChanged.subscribe(app => {
      this.getPreferences();
    });
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }

  getServices() {
    const filter: any = { status: 'Active', app: this.commonService.app._id };
    if (!this.commonService.userDetails.isSuperAdmin
      && this.commonService.servicesWithAccess.length > 0 && !this.commonService.isAppAdmin()) {
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
    this.pinnedDs = [];
    this.records = [];
    this.subscriptions.getServices = this.commonService
      .get('sm', `/${this.commonService.app._id}/service`, options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        this.showLazyLoader = false;
        if (res.length > 0) {
          this.records = res;
          if (this.preference && this.preference.value) {
            const keyMap = _.keyBy(this.preference.value, function (o) { return o._id });
            this.pinnedDs = _.filter(res, function (u) {
              return keyMap[u._id] !== undefined;
            });

          }

          if (this.pinnedDs.length > 0) {
            this.records = this.records.filter(ele => {
              return !this.pinnedDs.some(ds => {
                return ds._id === ele._id
              })
            })
          }

          this.appService.fetchedServiceList = [...this.records];
          if (!this.activeId) {
            // this.loadDataService(this.pinnedDs?.length ? this.pinnedDs[0] : res[0]);
            this.router.navigate(['/', this.commonService.app._id, 'services', 'overview']);
          } else {
            const activeService = res.find(e => e._id === this.activeId);
            if (!!activeService) {
              this.loadDataService(activeService);
            }
          }
        } else {
          this.router.navigate(['/', this.commonService.app._id, 'no-services']);
        }
      }, err => {
        console.error(err);
        this.showLazyLoader = false;
      });
  }

  getPreferences() {
    const options: GetOptions = {
      filter: {
        userId: this.commonService.userDetails._id,
        type: 'pinned-ds',
        key: this.commonService.app._id
      }
    };
    this.pinnedDs = [];
    this.records = [];
    this.commonService.get('user', '/data/preferences', options)
      .subscribe(prefRes => {
        if (prefRes.length) {
          this.prefId = prefRes[0]._id;
          this.preference = prefRes[0];
          if (typeof this.preference.value === 'string') {
            this.preference.value = JSON.parse(this.preference.value)
          }
        }
        this.getServices();
      }, err => {
        console.error(err);
        this.getServices();
        this.commonService.errorToast(err, 'Unable to get starred services')
      });
  }

  loadDataService(service: any, force?: boolean) {
    this.appService.serviceId = service._id;
    this.dashboardService.selectedService.emit(service);
    if (!this.activeId || force) {
      this.router.navigateByUrl(['', this.commonService.app._id, 'services'].join('/')).then(() => {
        this.router.navigate(['/', this.commonService.app._id, 'services', service._id, 'list']);
      });
    }
  }

  addToStaredList(serviceId) {
    const data = {
      userId: this.commonService.userDetails._id,
      key: this.commonService.app._id,
      type: 'pinned-ds',
      value: JSON.stringify([{ _id: serviceId }])
    }
    let response;
    if (this.prefId) {
      this.preference.value.push({ _id: serviceId });
      this.preference.value = JSON.stringify(this.preference.value);
      response = this.commonService.put('user', '/data/preferences/' + this.prefId, this.preference)
    } else {
      response = this.commonService.post('user', '/data/preferences', data)

    }
    response.subscribe(res => {
      this.preference = res;
      this.prefId = res._id;
      this.preference.value = JSON.parse(this.preference.value);
      this.preference.value.forEach(element => {
        const index = this.records.findIndex(ele => ele._id === element._id);
        if (index > -1) {
          this.pinnedDs.unshift(this.records[index]);
          this.getPreferences();
          if (this.dsType === 'ds') {
            this.onStarredAction.emit('pinnedDs')
          }
          // this.records.splice(index, 1)
        }
      });
    }, err => {
      this.commonService.errorToast(err, 'Unable to add dataservice to pinned list');
    });

  }

  removeFromStaredList(serviceId) {
    if (this.preference && this.preference.value) {
      let index = this.preference.value.findIndex(ele => ele._id === serviceId);
      this.preference.value.splice(index, 1);
      this.preference.value = JSON.stringify(this.preference.value);
      const respose = this.commonService.put('user', '/data/preferences/' + this.prefId, this.preference);
      respose.subscribe(res => {
        this.preference = res;
        if (typeof this.preference.value === 'string') {
          this.preference.value = JSON.parse(this.preference.value);
        }
        index = this.pinnedDs.findIndex(ele => ele._id === serviceId);
        if (index > -1) {
          // this.records.push(this.pinnedDs[index]);
          this.records.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
          this.pinnedDs.splice(index, 1);
          this.getPreferences();
          if (this.dsType === 'ds') {
            this.onStarredAction.emit('pinnedDs')
          } else {
            this.onStarredAction.emit('ds')
          }
        }
      }, err => {
        this.commonService.errorToast(err, 'Unable to remove dataservice from pinned list');
      })
    }
  }

  isPinned(item) {
    const id = item._id;
    let exists;
    if (this.preference?.value && Array.isArray(this.preference?.value)) {
      exists = this.preference?.value?.find(element =>
        element._id === id
      );
      return exists
    }
  }

  get app() {
    return this.commonService.app._id;
  }
}

