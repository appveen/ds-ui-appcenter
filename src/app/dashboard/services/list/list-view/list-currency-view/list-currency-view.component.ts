import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'odp-list-currency-view',
  templateUrl: './list-currency-view.component.html',
  styleUrls: ['./list-currency-view.component.scss']
})
export class ListCurrencyViewComponent implements OnInit {

  @Input() currencyVal;
  @Input() currency;

  constructor() { }

  ngOnInit() {
  }

}
