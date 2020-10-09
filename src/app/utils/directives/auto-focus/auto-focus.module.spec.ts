import { AutoFocusModule } from './auto-focus.module';

describe('AutoFocusModule', () => {
  let autoFocusModule: AutoFocusModule;

  beforeEach(() => {
    autoFocusModule = new AutoFocusModule();
  });

  it('should create an instance', () => {
    expect(autoFocusModule).toBeTruthy();
  });
});
