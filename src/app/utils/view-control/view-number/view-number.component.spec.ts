import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewNumberComponent } from './view-number.component';
import { AppService } from 'src/app/service/app.service';

describe('ViewNumberComponent', () => {
  let component: ViewNumberComponent;
  let fixture: ComponentFixture<ViewNumberComponent>;
  let appService: AppService;;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewNumberComponent],
      providers: [AppService],

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewNumberComponent);
    component = fixture.componentInstance;
    appService = TestBed.get(AppService);
    component.definition = {
      camelCase: "numbAttr",
      key: "numbAttr",
      level: 0,
      path: "numbAttr",
      properties: {
        dataKey: "numbAttr",
        dataPath: "numbAttr",
        fieldLength: 0,
        max: 5,
        min: 2,
        name: "numbAttr",
        precision: 2,
        type: "Number",
        value: 4
      }
    };
    component.oldValue = {
      numbAttr: 3
    };
    component.newValue = {
      numbAttr: 4
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should return the old value of the path', () => {
    component.definition.path = 'numbAttr';
    expect(component.oldVal).toEqual(3);
  })

  it('should return the new value of the path', () => {
    component.definition.path = 'numbAttr';
    expect(component.newVal).toEqual(4);
  })
});
