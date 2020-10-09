import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingFilterComponent } from './floating-filter.component';

describe('FloatingFilterComponent', () => {
  let component: FloatingFilterComponent;
  let fixture: ComponentFixture<FloatingFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FloatingFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FloatingFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
