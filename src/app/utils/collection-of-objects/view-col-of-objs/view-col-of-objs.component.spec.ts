import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewColOfObjsComponent } from './view-col-of-objs.component';

describe('ViewColOfObjsComponent', () => {
  let component: ViewColOfObjsComponent;
  let fixture: ComponentFixture<ViewColOfObjsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewColOfObjsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewColOfObjsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
