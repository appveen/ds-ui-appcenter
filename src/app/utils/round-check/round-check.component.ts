import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'odp-round-check',
  templateUrl: './round-check.component.html',
  styleUrls: ['./round-check.component.scss']
})
export class RoundCheckComponent {

  @Input() disabled: boolean;
  @Input() white: boolean;
  @Input() checked: boolean;
  @Output() checkedChange: EventEmitter<boolean>;
  constructor() {
    const self = this;
    self.checkedChange = new EventEmitter();
  }

  onChange(event, val) {
    if (!!event) {
      event.stopPropagation();
    }
    const self = this;
    if (self.disabled) {
      return;
    }
    self.checked = val;
    self.checkedChange.emit(val);
  }

}
