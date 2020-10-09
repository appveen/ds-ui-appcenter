import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSwitcherIconComponent } from './app-switcher-icon.component';

describe('AppSwitcherIconComponent', () => {
  let component: AppSwitcherIconComponent;
  let fixture: ComponentFixture<AppSwitcherIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppSwitcherIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSwitcherIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
