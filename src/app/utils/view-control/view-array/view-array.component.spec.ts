import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewArrayComponent } from 'src/app/utils/view-control/view-array/view-array.component';

describe('ViewArrayComponent', () => {
  let component: ViewArrayComponent;
  let fixture: ComponentFixture<ViewArrayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewArrayComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
