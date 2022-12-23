import { Component, OnInit, Input, OnDestroy, ViewChild, ComponentRef, TemplateRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray } from '@angular/forms';
import { ArrayControlComponent } from './array-control/array-control.component';
import { AppService } from 'src/app/service/app.service';

@Component({
    selector: 'odp-manage-control',
    templateUrl: './manage-control.component.html',
    styleUrls: ['./manage-control.component.scss']
})
export class ManageControlComponent implements OnInit, OnDestroy {

    @Input() form: UntypedFormGroup;
    @Input() definition: any;
    @Input() first: boolean;
    @Input() last: boolean;
    @Input() markEnable: boolean;
    @ViewChild('arrayControl', { static: false }) arrayControlRef: ArrayControlComponent;
    canEnable: boolean;
    checkboxKey: string;
    constructor(
        private appService: AppService
    ) {
        const self = this;
        self.canEnable = true;
    }

    ngOnInit() {
        const self = this;
        if (self.definition.key === '_id' || self.definition.properties.unique || self.definition.properties.readonly) {
            self.canEnable = false;
        }
        self.checkboxKey = self.definition.path + '_' + Date.now();
    }

    ngOnDestroy() {

    }

    spacing(level: number, arr?) {
        return {
            'min-width': (level * 10) + 'px',
            'margin-right': !arr ? (level === 1 ? 0 : 5) + 'px' : '20px',
            'min-height': '36px',
            'max-height': '100%'
        };
    }

    enableFieldsIndividually(def, control) {
        def.definition.forEach(element => {
            if (element.type !== 'Object') {
                if (!element.properties.readonly) {
                    control.get(element.key).enable();
                }
            } else {
                this.enableFieldsIndividually(element, control.get(element.key));
            }
        });
    }

    get objectForm() {
        const self = this;
        return self.form?.get(self.definition.key) as UntypedFormGroup;
    }

    get arrayForm() {
        const self = this;
        return self.form?.get(self.definition.key) as UntypedFormArray;
    }

    get toggleEnable() {
        const self = this;
        return self.form?.get(self.definition.key)?.enabled;
    }

    set toggleEnable(val) {
        const self = this;
        if (val) {
            if (this.definition.type === 'Object') {
                self.enableFieldsIndividually(this.definition, self.form?.get(self.definition.key));
            } else {
                self.form?.get(self.definition.key).enable();
            }
        } else {
            self.form?.get(self.definition.key).reset();
            self.form?.get(self.definition.key).disable();
        }
    }

    get controlType() {
        const self = this;
        if (self.definition.definition[0].type === 'Geojson') {
            return 'map';
        } else if (self.definition.definition[0].type === 'Object') {
            return 'object';
        } else if (self.definition.definition[0].type === 'Array') {
            return 'array';
        } else {
            return 'others';
        }
    }

}
