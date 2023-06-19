import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadObjectComponent } from './payload-object.component';

describe('PayloadObjectComponent', () => {
  let component: PayloadObjectComponent;
  let fixture: ComponentFixture<PayloadObjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadObjectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
