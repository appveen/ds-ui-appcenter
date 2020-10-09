import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateFilterPickerComponent } from './date-filter-picker.component';

describe('DateFilterPickerComponent', () => {
  let component: DateFilterPickerComponent;
  let fixture: ComponentFixture<DateFilterPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DateFilterPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateFilterPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
