import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnMappingControlComponent } from './column-mapping-control.component';

describe('ColumnMappingControlComponent', () => {
  let component: ColumnMappingControlComponent;
  let fixture: ComponentFixture<ColumnMappingControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColumnMappingControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnMappingControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
