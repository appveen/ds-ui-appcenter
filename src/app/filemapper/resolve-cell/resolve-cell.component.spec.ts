import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolveCellComponent } from './resolve-cell.component';

describe('ResolveCellComponent', () => {
  let component: ResolveCellComponent;
  let fixture: ComponentFixture<ResolveCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResolveCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResolveCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
