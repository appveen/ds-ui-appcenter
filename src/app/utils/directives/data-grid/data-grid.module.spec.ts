import { DataGridModule } from './data-grid.module';

describe('DataGridModule', () => {
  let dataGridModule: DataGridModule;

  beforeEach(() => {
    dataGridModule = new DataGridModule();
  });

  it('should create an instance', () => {
    expect(dataGridModule).toBeTruthy();
  });
});
