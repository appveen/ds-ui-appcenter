import { Component, Input, OnInit } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-list-longtxt-view',
  templateUrl: './list-longtxt-view.component.html',
  styleUrls: ['./list-longtxt-view.component.scss']
})
export class ListLongtxtViewComponent implements OnInit {

  @Input() value;
  @Input() id;
  serviceId: string;

  constructor(private appService: AppService) {
    const self = this;
    self.serviceId = self.appService.serviceId;
  }

  ngOnInit() {
  }

}
