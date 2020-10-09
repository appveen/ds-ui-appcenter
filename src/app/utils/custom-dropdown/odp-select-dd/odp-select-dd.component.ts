import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'odp-odp-select-dd',
  templateUrl: './odp-select-dd.component.html',
  styleUrls: ['./odp-select-dd.component.scss']
})
export class OdpSelectDdComponent implements OnInit {

  @Input() dropdownList: Array<any>;

  constructor() { }

  ngOnInit() {
  }

}
