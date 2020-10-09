import { RadioBtnModule } from './radio-btn.module';

describe('RadioBtnModule', () => {
  let radioBtnModule: RadioBtnModule;

  beforeEach(() => {
    radioBtnModule = new RadioBtnModule();
  });

  it('should create an instance', () => {
    expect(radioBtnModule).toBeTruthy();
  });
});
