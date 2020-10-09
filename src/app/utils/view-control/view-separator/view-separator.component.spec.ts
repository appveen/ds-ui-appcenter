import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSeparatorComponent } from './view-separator.component';

describe('ViewSeparatorComponent', () => {
  let component: ViewSeparatorComponent;
  let fixture: ComponentFixture<ViewSeparatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSeparatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSeparatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
