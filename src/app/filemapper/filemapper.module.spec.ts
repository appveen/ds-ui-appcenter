import { FilemapperModule } from './filemapper.module';

describe('FilemapperModule', () => {
  let filemapperModule: FilemapperModule;

  beforeEach(() => {
    filemapperModule = new FilemapperModule();
  });

  it('should create an instance', () => {
    expect(filemapperModule).toBeTruthy();
  });
});
