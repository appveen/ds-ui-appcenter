import { Component, OnInit } from '@angular/core';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'odp-workflow-overview',
  templateUrl: './workflow-overview.component.html',
  styleUrls: ['./workflow-overview.component.scss']
})
export class WorkflowOverviewComponent implements OnInit {

  showLazyLoader: boolean;
  searchTerm: string;
  services: any;
  ogServices: any;
  constructor(
    private commonService: CommonService
  ) { }


  ngOnInit(): void {
    const self = this;
    self.services = [];
    self.ogServices = [];
    self.showLazyLoader = true;
    self.getServices();
  }

  getServices() {
    const self = this;
    const filter: any = { status: 'Active', app: self.commonService.app._id, 'workflowConfig.enabled': true };
    if (!self.commonService.userDetails.isSuperAdmin
      && self.commonService.servicesWithAccess.length > 0 && !self.commonService.isAppAdmin()) {
      filter._id = {
        $in: self.commonService.servicesWithAccess
      };
    }
    if (self.searchTerm) {
      filter.name = '/' + self.searchTerm + '/';
    }
    const options: GetOptions = {
      count: -1,
      filter,
      // select: 'name',
      sort: 'name'
    };

    self.commonService
      .get('sm', `/${self.commonService.app._id}/service`, options)
      .pipe(distinctUntilChanged())
      .subscribe(res => {
        {
          self.services = res;
          self.ogServices = res;
          self.showLazyLoader = false;
        }
      });
  }

  search(value) {
    const self = this;
    if (!value || !value.trim()) {
      self.services = self.ogServices
      return;
    }
    this.searchTerm = value.trim();
    self.services = [];
    // self.showLazyLoader = true;
    self.services = self.ogServices.filter(ele => ele.name.toLowerCase().indexOf(this.searchTerm) > -1);
  }

  resetSearch() {
    const self = this;
    this.searchTerm = null;
    self.services = [];
    // self.showLazyLoader = true;
    self.services = self.ogServices
    // self.getServices();
  }
}
