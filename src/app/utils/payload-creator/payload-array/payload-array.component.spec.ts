import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadArrayComponent } from './payload-array.component';

describe('PayloadArrayComponent', () => {
  let component: PayloadArrayComponent;
  let fixture: ComponentFixture<PayloadArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadArrayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
