import { TestBed } from '@angular/core/testing';

import { PisosService } from './pisos.service';

describe('PisosService', () => {
  let service: PisosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PisosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
