import { Component, OnInit, Input } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {

  @Input() definition: Definition;
  @Input() data: any;
  serviceId: string;
  documentId: string;
  searchFieldValue: string;
  constructor(private appService: AppService) {
    const self = this;
  }

  ngOnInit() {
    const self = this;
    if (self.data) {
      self.documentId = self.appService.getValue(self.definition.dataKey + '._id', self.data);
      const dataKey = self.definition.dataKey + '.' + self.definition.properties.relatedSearchField;
      self.searchFieldValue = self.appService.getValue(dataKey, self.data);
      if (!self.searchFieldValue) {
        self.searchFieldValue = self.documentId;
      }
    }
  }

}
