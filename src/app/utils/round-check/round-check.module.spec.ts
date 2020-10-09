import { RoundCheckModule } from './round-check.module';

describe('RoundCheckModule', () => {
  let roundCheckModule: RoundCheckModule;

  beforeEach(() => {
    roundCheckModule = new RoundCheckModule();
  });

  it('should create an instance', () => {
    expect(roundCheckModule).toBeTruthy();
  });
});
