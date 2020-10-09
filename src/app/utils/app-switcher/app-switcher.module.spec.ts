import { AppSwitcherModule } from './app-switcher.module';

describe('AppSwitcherModule', () => {
  let appSwitcherModule: AppSwitcherModule;

  beforeEach(() => {
    appSwitcherModule = new AppSwitcherModule();
  });

  it('should create an instance', () => {
    expect(appSwitcherModule).toBeTruthy();
  });
});
