import { FileSizePipe } from 'src/app/pipes/file-size.pipe';

describe('FilesizePipe', () => {
  it('create an instance', () => {
    const pipe = new FileSizePipe();
    expect(pipe).toBeTruthy();
  });
});
