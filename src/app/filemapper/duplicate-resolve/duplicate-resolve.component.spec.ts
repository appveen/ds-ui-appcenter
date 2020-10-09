import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicateResolveComponent } from './duplicate-resolve.component';

describe('DuplicateResolveComponent', () => {
  let component: DuplicateResolveComponent;
  let fixture: ComponentFixture<DuplicateResolveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DuplicateResolveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicateResolveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
