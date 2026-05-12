import { Test, TestingModule } from '@nestjs/testing';
import { TorneiosController } from './torneios.controller';

describe('TorneiosController', () => {
  let controller: TorneiosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TorneiosController],
    }).compile();

    controller = module.get<TorneiosController>(TorneiosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
