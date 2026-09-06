import { TestBed } from '@angular/core/testing';
import { EntityCrud } from './entity-crud';

describe('EntityCrud', () => {
  let service: EntityCrud;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityCrud);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
