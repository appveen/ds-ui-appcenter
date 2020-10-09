import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { Subscription } from 'rxjs';
import { AppService } from '../../../service/app.service';

@Component({
  selector: 'odp-interaction-grid-filter',
  templateUrl: './interaction-grid-filter.component.html',
  styleUrls: ['./interaction-grid-filter.component.scss']
})
export class InteractionGridFilterComponent implements OnInit, OnDestroy {
  @Input() definition: Definition;
  @Input() filterModel: any;
  @Output() filterModelChange: EventEmitter<any>;
  filterSubs: Subscription;

  constructor(private appService: AppService) {
    const self = this;
    self.filterModelChange = new EventEmitter();
  }

  ngOnInit() {
    const self = this;
    self.filterSubs = self.appService.clearInteractionFilterEvent.subscribe(() => {
      self.filterModel[self.definition.dataKey].value = null;
    });
  }

  onChange(value) {
    const self = this;
    if (value) {
      self.filterModel[self.definition.dataKey] =  {
        value,
        type: self.definition.type
      };
    } else {
      delete self.filterModel[self.definition.dataKey];
    }
    self.filterModelChange.emit(self.filterModel);
  }

  get value() {
    const self = this;
    if (self.filterModel && self.filterModel[self.definition.dataKey]) {
      return self.filterModel[self.definition.dataKey].value;
    }
    return '';
  }

  get type() {
    const self = this;
    return self.definition.type;
  }

  get checkbox() {
    const self = this;
    return self.definition.type === 'Checkbox';
  }

  ngOnDestroy() {
    const self = this;
    if (self.filterSubs) {
      self.filterSubs.unsubscribe();
    }
  }
}
