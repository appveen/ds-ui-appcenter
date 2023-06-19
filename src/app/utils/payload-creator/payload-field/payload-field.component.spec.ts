import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadFieldComponent } from './payload-field.component';

describe('PayloadFieldComponent', () => {
  let component: PayloadFieldComponent;
  let fixture: ComponentFixture<PayloadFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
