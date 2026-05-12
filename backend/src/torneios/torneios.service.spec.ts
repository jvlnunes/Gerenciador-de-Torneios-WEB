import { Test, TestingModule } from '@nestjs/testing';
import { TorneiosService } from './torneios.service';

describe('TorneiosService', () => {
  let service: TorneiosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TorneiosService],
    }).compile();

    service = module.get<TorneiosService>(TorneiosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
