import { Component, OnInit } from '@angular/core';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { distinctUntilChanged } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash'

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
  serviceData: Array<any> = [];
  breadcrumb: Array<any> = [];
  constructor(
    private commonService: CommonService,
    private route: ActivatedRoute,
    private router: Router
  ) { }


  ngOnInit(): void {
    const self = this;
    self.services = [];
    self.ogServices = [];
    self.showLazyLoader = true;
    self.route.data.subscribe(data => {
      if (data.breadcrumb.length > 0) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
      }
      else {
        this.breadcrumb.push('Workflows')
      }
      this.breadcrumb.push('All Workfkows')
      this.commonService.breadcrumbPush(this.breadcrumb)
    })
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
          if (res.length > 1) {
            res.forEach(ele => {
              this.getServiceDetails(ele)
            })
          }
          self.ogServices = res;
          self.showLazyLoader = false;
        }
      });
  }

  getServiceDetails(service) {
    const api = service.api;
    this.commonService
      .get('api', `/${this.commonService.app._id}${api}/utils/workflow`, { select: '_id,operation,status', count: 100000000 })
      .subscribe(res => {
        const post = (res.filter(ele => ele.operation === 'POST' && ele.status === 'Pending') || []).length;
        const put = (res.filter(ele => ele.operation === 'PUT' && ele.status === 'Pending') || []).length;
        const del = (res.filter(ele => ele.operation === 'DELETE' && ele.status === 'Pending') || []).length;
        const draft = (res.filter(ele => ele.status === 'Draft') || []).length;
        // this.serviceData.push({
        //   _id: id,
        //   count: {
        //     new: post,
        //     update: put,
        //     delete: del,
        //     draft: draft
        //   }
        // })
        service['count'] = {
          new: post,
          update: put,
          delete: del,
          draft: draft
        }
        console.log(this.services)
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

  navigate(service) {
    this.router.navigate(['/', this.commonService.app._id, 'workflow', service._id]);
  }
}
