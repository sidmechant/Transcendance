import { Test, TestingModule } from '@nestjs/testing';
import { FortyTwoapiService } from './forty-twoapi.service';

describe('FortyTwoapiService', () => {
  let service: FortyTwoapiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FortyTwoapiService],
    }).compile();

    service = module.get<FortyTwoapiService>(FortyTwoapiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
