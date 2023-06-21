import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from 'src/user/entities/user.entity'
import { UserService } from 'src/user/user.service'
import { Util } from 'src/Util/Util'
import { TwoFactorAuthService } from './twoFactorAuth.service'

describe('TwoFactorAuthController', () => {
  let service: TwoFactorAuthService
  const util = new Util()
  const USER_REPOSITORY_TOKEN = getRepositoryToken(User)
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorAuthService,
        UserService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<TwoFactorAuthService>(TwoFactorAuthService)
  })

  describe('root', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })
    it("should be defined generateTwoFactorAuthenticationSecret and don't return null", () => {
      const user = util.getUser()
      expect(
        service.generateTwoFactorAuthenticationSecret(user),
      ).rejects.not.toBeNull()
      expect(service.generateTwoFactorAuthenticationSecret).toBeDefined()
    })
    it("should be defined isTwoFactorAuthenticationCodeValid and don't return null", () => {
      expect(service.isTwoFactorAuthenticationCodeValid).toBeDefined()
    })
  })
})
