import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecureTextTypeComponent } from './secure-text-type.component';
import { FormService } from 'src/app/service/form.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

describe('SecureTextTypeComponent', () => {
  let component: SecureTextTypeComponent;
  let fixture: ComponentFixture<SecureTextTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SecureTextTypeComponent],
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
    fixture = TestBed.createComponent(SecureTextTypeComponent);
    component = fixture.componentInstance;

    component.definition = {
      camelCase: 'testAttrbute',
      key: 'testAttrbute',
      level: 0,
      path: 'testAttrbute'
      , properties: {
        dataKey: 'testAttrbute',
        dataPath: 'testAttrbute',
        fieldLength: 0,
        name: 'testAttrbute',
        _description: 'gfg fgfgfg', type: 'String'
      }, value: null
    };
    component.control = new FormControl();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch empty string to the control if the control value is null', () => {
    component.control = new FormControl();
    component.ngOnInit();
    expect(component.control.value).toBe('');
  })

  it('should patch value to the password attribute', () => {
    component.control = new FormControl({ value: 'sow@12345' });
    component.ngOnInit();
    expect(component.password).toBe('sow@12345');
  })

  it('should return true if required error is there', () => {
    component.control = new FormControl('', Validators.required);
    component.control.markAsTouched();
    expect(component.requiredError).toBe(true);
  })

  it('should return false if required error is not there', () => {
    component.control = new FormControl('12345', Validators.required);
    component.control.markAsTouched();
    expect(component.requiredError).toBe(false);
  })

  it('should return true if pattern error is there', () => {
    component.control = new FormControl('1234', Validators.pattern("[a-zA-Z ]*"));
    component.control.markAsTouched();
    expect(component.patternError).toBe(true);
  })

  it('should return false if pattern error is not there', () => {
    component.control = new FormControl('sow', Validators.pattern("[a-zA-Z ]*"));
    component.control.markAsTouched();
    expect(component.patternError).toBe(false);
  })
  it('should return true if minLength error is there', () => {
    component.control = new FormControl('1234', Validators.minLength(5));
    component.control.markAsTouched();
    expect(component.minLengthError).toBe(true);
  })

  it('should return false if minLength error is not there', () => {
    component.control = new FormControl('sow', Validators.minLength(3));
    component.control.markAsTouched();
    expect(component.minLengthError).toBe(false);
  })

  it('should return true if maxLength error is there', () => {
    component.control = new FormControl('1234444', Validators.maxLength(5));
    component.control.markAsTouched();
    expect(component.maxLengthError).toBe(true);
  })

  it('should return false if maxLength error is not there', () => {
    component.control = new FormControl('sow', Validators.maxLength(3));
    component.control.markAsTouched();
    expect(component.maxLengthError).toBe(false);
  })

  it('should patch changed value to the control', () => {
    component.onChange('sow@12345');
    expect(component.control.value.value).toBe('sow@12345');
  })

});
