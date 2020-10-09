import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorRecordsComponent } from './error-records.component';

describe('ErrorRecordsComponent', () => {
  let component: ErrorRecordsComponent;
  let fixture: ComponentFixture<ErrorRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
