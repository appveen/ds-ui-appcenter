import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConflictResolveComponent } from './conflict-resolve.component';

describe('ConflictResolveComponent', () => {
  let component: ConflictResolveComponent;
  let fixture: ComponentFixture<ConflictResolveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConflictResolveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConflictResolveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
