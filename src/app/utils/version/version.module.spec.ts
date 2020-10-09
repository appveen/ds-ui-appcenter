import { VersionModule } from './version.module';

describe('VersionModule', () => {
  let versionModule: VersionModule;

  beforeEach(() => {
    versionModule = new VersionModule();
  });

  it('should create an instance', () => {
    expect(versionModule).toBeTruthy();
  });
});
