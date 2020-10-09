import { TruncatedModule } from './truncated.module';

describe('TruncatedModule', () => {
  let truncatedModule: TruncatedModule;

  beforeEach(() => {
    truncatedModule = new TruncatedModule();
  });

  it('should create an instance', () => {
    expect(truncatedModule).toBeTruthy();
  });
});
