import { Component, OnInit, Input } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'odp-list-user-view',
  templateUrl: './list-user-view.component.html',
  styleUrls: ['./list-user-view.component.scss']
})
export class ListUserViewComponent implements OnInit {
  @Input() definition: Definition;
  @Input() data: any;
  valueExist: boolean;
  searchFieldValue: any;
  private subscriptions: any;
  private showOnlyId: boolean;
  private relatedDefinition: any;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private datePipe: DatePipe) {
    const self = this;
    self.subscriptions = {};
  }

  ngOnInit() {
    const self = this;
    const value = self.appService.getValue(self.definition.dataKey, self.data);
    if (value && Object.keys(value).length > 0 && value._id) {
      self.valueExist = true;
    }
    if (self.showOnlyId) {
      self.searchFieldValue = self.appService.getValue(self.definition.dataKey + '._id', self.data);
    } else {
      self.searchFieldValue = self.appService.getValue(self.definition.dataKey + '.'
        + self.definition.properties.relatedSearchField, self.data);
    }
  }

 

  getValue(key, obj) {
    const self = this;
    return self.appService.getValue(key, obj);
  }

}
