import { Test, TestingModule } from '@nestjs/testing';
import { FortyTwoapiController } from './forty-twoapi.controller';

describe('FortyTwoapiController', () => {
  let controller: FortyTwoapiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FortyTwoapiController],
    }).compile();

    controller = module.get<FortyTwoapiController>(FortyTwoapiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
