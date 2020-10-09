import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageControlComponent } from './manage-control.component';

describe('ManageControlComponent', () => {
  let component: ManageControlComponent;
  let fixture: ComponentFixture<ManageControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
