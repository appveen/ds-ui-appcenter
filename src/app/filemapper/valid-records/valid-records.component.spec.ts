import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidRecordsComponent } from './valid-records.component';

describe('ValidRecordsComponent', () => {
  let component: ValidRecordsComponent;
  let fixture: ComponentFixture<ValidRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ValidRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
