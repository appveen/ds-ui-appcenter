import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrayVersionComponent } from './array-version.component';

describe('ArrayVersionComponent', () => {
  let component: ArrayVersionComponent;
  let fixture: ComponentFixture<ArrayVersionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArrayVersionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArrayVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
