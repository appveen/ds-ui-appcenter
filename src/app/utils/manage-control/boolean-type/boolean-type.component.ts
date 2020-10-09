import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'odp-boolean-type',
  templateUrl: './boolean-type.component.html',
  styleUrls: ['./boolean-type.component.scss']
})
export class BooleanTypeComponent implements OnInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  controlId: string;
  constructor() { };


  ngOnInit() {
    const self = this;
    if (self.control && self.control.value === null) {
      self.control.setValue(false);
    }
    self.controlId= self.definition.path +Math.random();
  }
}
