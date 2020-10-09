import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDateComponent } from './view-date.component';
import { AppService } from 'src/app/service/app.service';

describe('ViewDateComponent', () => {
  let component: ViewDateComponent;
  let fixture: ComponentFixture<ViewDateComponent>;
  let appService: AppService;;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewDateComponent],
      providers: [AppService],

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewDateComponent);
    component = fixture.componentInstance;
    appService = TestBed.get(AppService);

    component.definition = {
      camelCase: "dateAttr",
      key: "dateAttr",
      level: 0,
      path: "dateAttr",
      properties: {
        dataKey: "dateAttr",
        dataPath: "dateAttr",
        dateType: "date",
        fieldLength: 0,
        name: "dateAttr",
        _typeChanged: "Date"
      },
      type: "Date",
      value: "2019-10-30T00:00:00.000Z",
    };
    component.oldValue = {
      dateAttr: '2019-10-31T00:00:00.000Z'
    };
    component.newValue = {
      dateAttr: '2019-10-30T00:00:00.000Z'

    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should return the old value of the path', () => {
    component.definition.path = 'dateAttr';
    expect(component.oldVal).toEqual('2019-10-31T00:00:00.000Z');
  })

  it('should return the new value of the path', () => {
    component.definition.path = 'dateAttr';
    expect(component.newVal).toEqual('2019-10-30T00:00:00.000Z');
  })
});
