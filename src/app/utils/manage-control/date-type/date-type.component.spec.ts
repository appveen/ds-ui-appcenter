import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateTypeComponent } from 'src/app/utils/manage-control/date-type/date-type.component';

describe('DateTypeComponent', () => {
  let component: DateTypeComponent;
  let fixture: ComponentFixture<DateTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DateTypeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
