import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextTypeComponent } from 'src/app/utils/manage-control/text-type/text-type.component';
import { FormService } from 'src/app/service/form.service';
import { UntypedFormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SecureTextTypeComponent } from '../secure-text-type/secure-text-type.component';

describe('TextTypeComponent', () => {
  let component: TextTypeComponent;
  let fixture: ComponentFixture<TextTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TextTypeComponent, SecureTextTypeComponent],
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
    fixture = TestBed.createComponent(TextTypeComponent);
    component = fixture.componentInstance;
    component.control = new UntypedFormControl();
    component.definition = {
      camelCase: "testAttrbute",
      key: "testAttrbute",
      level: 0,
      path: "testAttrbute",
      properties: {
        dataKey: "testAttrbute",
        dataPath: "testAttrbute",
        fieldLength: 0,
        name: "testAttrbute",
        _description: "gfg fgfgfg",
        type: "String"
      },
      value: null
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch empty string to the control if the control value is null', () => {
    component.ngOnInit();
    component.definition = {
      camelCase: "testAttrbute",
      key: "testAttrbute",
      level: 0,
      path: "testAttrbute",
      properties: {
        dataKey: "testAttrbute",
        dataPath: "testAttrbute",
        enum: ['val1', 'val2'],
        fieldLength: 0,
        name: "testAttrbute",
        _description: "gfg fgfgfg",
        type: "String"
      },
      value: null
    }
    component.ngOnInit();
    expect(component.control.value).toBe('');
  })
  it('control value should be null if there is no enum value', () => {
    component.ngOnInit();
    expect(component.control.value).toBe(null);
  })

  it('should return password, if the definition type is password', () => {
    component.definition = {
      camelCase: "testAttrbute",
      key: "testAttrbute",
      level: 0,
      path: "testAttrbute",
      properties: {
        dataKey: "testAttrbute",
        dataPath: "testAttrbute",
        fieldLength: 0,
        name: "testAttrbute",
        _description: "gfg fgfgfg",
        type: "String",
        password: true
      },
      value: null
    }
    expect(component.specificType).toBe('password');
  })



  it('should return email, if the definition type is email', () => {
    component.definition = {
      camelCase: "testAttrbute",
      key: "testAttrbute",
      level: 0,
      path: "testAttrbute",
      properties: {
        dataKey: "testAttrbute",
        dataPath: "testAttrbute",
        fieldLength: 0,
        name: "testAttrbute",
        _description: "gfg fgfgfg",
        type: "String",
        email: true
      },
      value: null
    }
    expect(component.specificType).toBe('email');
  })
  it('should return select, if the definition as a enum', () => {
    component.definition = {
      camelCase: "testAttrbute",
      key: "testAttrbute",
      level: 0,
      path: "testAttrbute",
      properties: {
        dataKey: "testAttrbute",
        dataPath: "testAttrbute",
        enum: ['val1', 'val2'],
        fieldLength: 0,
        name: "testAttrbute",
        _description: "gfg fgfgfg",
        type: "String",
      },
      value: null
    }
    expect(component.specificType).toBe('select');
  })
  it('should return text, if the definition is not type of password,email or select', () => {
    component.definition = {
      camelCase: "testAttrbute",
      key: "testAttrbute",
      level: 0,
      path: "testAttrbute",
      properties: {
        dataKey: "testAttrbute",
        dataPath: "testAttrbute",
        fieldLength: 0,
        name: "testAttrbute",
        _description: "gfg fgfgfg",
        type: "String",
      },
      value: null
    }
    expect(component.specificType).toBe('text');
  })

  it('should return true if required error is there', () => {
    component.control = new UntypedFormControl('', Validators.required);
    component.control.markAsTouched();
    expect(component.requiredError).toBe(true);
  })

  it('should return false if required error is not there', () => {
    component.control = new UntypedFormControl('12345', Validators.required);
    component.control.markAsTouched();
    expect(component.requiredError).toBe(false);
  })
  it('should return true if pattern error is there', () => {
    component.control = new UntypedFormControl('1234', Validators.pattern("[a-zA-Z ]*"));
    component.control.markAsTouched();
    expect(component.patternError).toBe(true);
  })

  it('should return false if pattern error is not there', () => {
    component.control = new UntypedFormControl('sow', Validators.pattern("[a-zA-Z ]*"));
    component.control.markAsTouched();
    expect(component.patternError).toBe(false);
  })
  it('should return true if minLength error is there', () => {
    component.control = new UntypedFormControl('1234', Validators.minLength(5));
    component.control.markAsTouched();
    expect(component.minLengthError).toBe(true);
  })

  it('should return false if minLength error is not there', () => {
    component.control = new UntypedFormControl('sow', Validators.minLength(3));
    component.control.markAsTouched();
    expect(component.minLengthError).toBe(false);
  })

  it('should return true if maxLength error is there', () => {
    component.control = new UntypedFormControl('1234444', Validators.maxLength(5));
    component.control.markAsTouched();
    expect(component.maxLengthError).toBe(true);
  })

  it('should return false if maxLength error is not there', () => {
    component.control = new UntypedFormControl('sow', Validators.maxLength(3));
    component.control.markAsTouched();
    expect(component.maxLengthError).toBe(false);
  })

  it('should return true if email error is there and tab out ', () => {
    component.emailShow = true;
    component.control = new UntypedFormControl('sowbhagyagmail', Validators.email);
    component.control.markAsTouched();
    expect(component.emailError).toBe(true);
  })

  it('should return false if email error is not there', () => {
    component.control = new UntypedFormControl('sowbhagya@gmail.com', Validators.email);
    component.control.markAsTouched();
    expect(component.emailError).toBe(false);
  })

 
});
