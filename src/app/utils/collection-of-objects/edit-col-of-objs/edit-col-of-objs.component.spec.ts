import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditColOfObjsComponent } from './edit-col-of-objs.component';

describe('EditColOfObjsComponent', () => {
  let component: EditColOfObjsComponent;
  let fixture: ComponentFixture<EditColOfObjsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditColOfObjsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditColOfObjsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
