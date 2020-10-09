import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilemapperComponent } from 'src/app/filemapper/filemapper.component';

describe('FilemapperComponent', () => {
  let component: FilemapperComponent;
  let fixture: ComponentFixture<FilemapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FilemapperComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilemapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getSchema', () => {
  });
});
