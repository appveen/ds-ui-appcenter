import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLongTextComponent } from './view-long-text.component';

describe('ViewLongTextComponent', () => {
  let component: ViewLongTextComponent;
  let fixture: ComponentFixture<ViewLongTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewLongTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewLongTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
