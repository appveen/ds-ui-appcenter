import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanTypeComponent } from 'src/app/utils/manage-control/boolean-type/boolean-type.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

describe('BooleanTypeComponent', () => {
  let component: BooleanTypeComponent;
  let fixture: ComponentFixture<BooleanTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BooleanTypeComponent],
      imports: [
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanTypeComponent);
    component = fixture.componentInstance;
    component.control = new FormControl();

    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  fit('should set the value to false, if the value is null', () => {
    component.ngOnInit();
    expect(component.control.value).toBe(false);

  })

});
