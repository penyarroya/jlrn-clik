import { TestBed } from '@angular/core/testing';
import { EntityConfigService } from '../sidebar/entity-config.service';

describe('EntityConfigService', () => {
  let service: EntityConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
