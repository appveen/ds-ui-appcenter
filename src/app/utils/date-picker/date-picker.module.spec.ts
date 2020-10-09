import { DatePickerModule } from 'src/app/utils/date-picker/date-picker.module';

describe('DatePickerModule', () => {
  let datePickerModule: DatePickerModule;

  beforeEach(() => {
    datePickerModule = new DatePickerModule();
  });

  it('should create an instance', () => {
    expect(datePickerModule).toBeTruthy();
  });
});
