import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSecureTextComponent } from './view-secure-text.component';

describe('ViewSecureTextComponent', () => {
  let component: ViewSecureTextComponent;
  let fixture: ComponentFixture<ViewSecureTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSecureTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSecureTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
