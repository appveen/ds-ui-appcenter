import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberTypeComponent } from 'src/app/utils/manage-control/number-type/number-type.component';
import { FormService } from 'src/app/service/form.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

describe('NumberTypeComponent', () => {
  let component: NumberTypeComponent;
  let fixture: ComponentFixture<NumberTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NumberTypeComponent],
      providers: [FormService],
      imports: [
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberTypeComponent);
    component = fixture.componentInstance;
    component.control = new FormControl();
    component.definition = {
      camelCase: "numbAttr",
      key: "numbAttr",
      level: 0,
      path: "numbAttr",
      properties: {
        dataKey: "numbAttr",
        dataPath: "numbAttr",
        fieldLength: 0,
        max: 5,
        min: 2,
        name: "numbAttr",
        precision: 2,
      },
      type: "Number",
      value: null
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the value depends on the precision', () => {
    component.control.patchValue(4.555555);
    component.setValue();
    expect(component.control.value).toBe(4.56);
  });

  it('should return currency if the definition type is currency', () => {
    component.definition = {
      camelCase: "numbAttr",
      key: "numbAttr",
      level: 0,
      path: "numbAttr",
      properties: {
        dataKey: "numbAttr",
        dataPath: "numbAttr",
        fieldLength: 0,
        currency:'INR',
        max: 5,
        min: 2,
        name: "numbAttr",
        precision: 2,
      },
      type: "Number",
      value: null
    }
    expect(component.specificType).toBe('currency');
  })
  it('should return number if the definition type niether eum,nor currency', () => {
    expect(component.specificType).toBe('number');
  })

  it('should return select if the definition type is list of values', () => {
    component.definition = {
      camelCase: "numbAttr",
      key: "numbAttr",
      level: 0,
      path: "numbAttr",
      properties: {
        dataKey: "numbAttr",
        dataPath: "numbAttr",
        fieldLength: 0,
        name: "numbAttr",
        precision: 2,
        enum:[1,3,5]
      },
      type: "Number",
      value: null
    }
    expect(component.specificType).toBe('select');
  });

  it('should return true if required error is there', () => {
    component.control = new FormControl(null, Validators.required);
    component.control.markAsTouched();
    expect(component.requiredError).toBe(true);
  });
  
  it('should return false if required error is not there', () => {
    component.control = new FormControl(12, Validators.required);
    component.control.markAsTouched();
    expect(component.requiredError).toBe(false);
  })

  it('should return true if min error is there', () => {
    component.control = new FormControl(3, Validators.min(5));
    component.control.markAsTouched();
    expect(component.minError).toBe(true);
  })

  it('should return false if min error is not there', () => {
    component.control = new FormControl(6, Validators.min(5));
    component.control.markAsTouched();
    expect(component.minError).toBe(false);
  })

  it('should return true if max error is there', () => {
    component.control = new FormControl(6, Validators.max(5));
    component.control.markAsTouched();
    expect(component.maxError).toBe(true);
  })

  it('should return false if max error is not there', () => {
    component.control = new FormControl(2, Validators.max(5));
    component.control.markAsTouched();
    expect(component.maxError).toBe(false);
  })


  // it('should set the selected value if number type is list of values', () => {
  //   component.control.patchValue(4);
  //   component.setValue();
  //   expect(component.control.value).toBe(4);
  // })


});
