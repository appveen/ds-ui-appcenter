import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundCheckComponent } from './round-check.component';

describe('RoundCheckComponent', () => {
  let component: RoundCheckComponent;
  let fixture: ComponentFixture<RoundCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoundCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
