import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridCheckboxComponent } from './grid-checkbox.component';

describe('GridCheckboxComponent', () => {
  let component: GridCheckboxComponent;
  let fixture: ComponentFixture<GridCheckboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridCheckboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
