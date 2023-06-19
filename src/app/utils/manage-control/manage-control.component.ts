import { Component, OnInit, Input, OnDestroy, ViewChild, ComponentRef, TemplateRef } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { ArrayControlComponent } from './array-control/array-control.component';
import { AppService } from 'src/app/service/app.service';

@Component({
    selector: 'odp-manage-control',
    templateUrl: './manage-control.component.html',
    styleUrls: ['./manage-control.component.scss']
})
export class ManageControlComponent implements OnInit, OnDestroy {

    @Input() form: FormGroup;
    @Input() definition: any;
    @Input() first: boolean;
    @Input() last: boolean;
    @Input() markEnable: boolean;
    @ViewChild('arrayControl', { static: false }) arrayControlRef: ArrayControlComponent;
    canEnable: boolean;
    checkboxKey: string;
    constructor(private appService: AppService) {
        this.canEnable = true;
    }

    ngOnInit() {
        if (this.definition.key === '_id' || this.definition.properties.unique || this.definition.properties.readonly) {
            this.canEnable = false;
        }
        this.checkboxKey = this.definition.path + '_' + Date.now();
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
        return this.form?.get(this.definition.key) as FormGroup;
    }

    get arrayForm() {
        return this.form?.get(this.definition.key) as FormArray;
    }

    get toggleEnable() {
        return this.form?.get(this.definition.key)?.enabled;
    }

    set toggleEnable(val) {
        if (val) {
            if (this.definition.type === 'Object' && !this.definition.properties.schemaFree) {
                this.enableFieldsIndividually(this.definition, this.form?.get(this.definition.key));
            } else {
                this.form?.get(this.definition.key).enable();
            }
        } else {
            this.form?.get(this.definition.key).reset();
            this.form?.get(this.definition.key).disable();
        }
    }

    get controlType() {
        if (this.definition.definition[0].type === 'Geojson') {
            return 'map';
        } else if (this.definition.definition[0].type === 'Object') {
            return 'object';
        } else if (this.definition.definition[0].type === 'Array') {
            return 'array';
        } else {
            return 'others';
        }
    }

    get schemaFreeData() {
        if (this.definition.properties.schemaFree) {
            return this.definition.value;
        }
        return null;
    }
    set schemaFreeData(data: any) {
        this.definition.value = data;
        this.form.get(this.definition.key).patchValue(data);
    }
}
