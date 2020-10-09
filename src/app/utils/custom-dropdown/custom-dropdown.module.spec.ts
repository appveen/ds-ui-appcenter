import { CustomDropdownModule } from './custom-dropdown.module';

describe('CustomDropdownModule', () => {
  let customDropdownModule: CustomDropdownModule;

  beforeEach(() => {
    customDropdownModule = new CustomDropdownModule();
  });

  it('should create an instance', () => {
    expect(customDropdownModule).toBeTruthy();
  });
});
