import { Component, Input, OnInit } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-list-richtxt-view',
  templateUrl: './list-richtxt-view.component.html',
  styleUrls: ['./list-richtxt-view.component.scss']
})
export class ListRichtxtViewComponent implements OnInit {

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
