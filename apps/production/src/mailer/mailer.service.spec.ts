import { Test, TestingModule } from '@nestjs/testing'
import { AppLoggerService } from 'src/logger/logger.service'
import { Util } from 'src/Util/Util'
import { MailerService } from './mailer.service'

describe('MailerService', () => {
  let service: MailerService
  const util = new Util()
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService, AppLoggerService],
    }).compile()

    service = module.get<MailerService>(MailerService)
  })

  describe('root', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })
    it('should be sendEmail function not null', () => {
      const email = util.getString()
      const template = util.getLetterTemplate()
      const spy = jest.spyOn(service, 'sendEmail')
      const isSandingEmail = service.sendEmail(email, template)
      expect(spy).toHaveBeenCalled()
      expect(isSandingEmail).not.toBeNull()
      spy.mockRestore()
    })
  })
  describe('mailer.service definding', () => {
    it('should be defined sendEmail()', () => {
      expect(service.sendEmail).toBeDefined()
    })
  })
})
