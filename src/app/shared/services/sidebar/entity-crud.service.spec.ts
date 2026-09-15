import { TestBed } from '@angular/core/testing';
import { EntityCrudService } from './entity-crud.service';

describe('EntityCrudService', () => {
  let service: EntityCrudService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityCrudService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
