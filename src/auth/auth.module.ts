import { forwardRef, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import TwitterStrategy from 'passport-twitter'

import { ActionTokensModule } from 'src/action-tokens/action-tokens.module'
import { MailerModule } from 'src/mailer/mailer.module'
import { UserModule } from 'src/user/user.module'
import { ProjectModule } from 'src/project/project.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import {
  ApiKeyStrategy,
  JwtAccessTokenStrategy,
  JwtRefreshTokenStrategy,
} from './strategies'

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule,
    forwardRef(() => UserModule),
    ActionTokensModule,
    MailerModule,
    ActionTokensModule,
    ProjectModule,
    TwitterStrategy,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    ApiKeyStrategy,
    TwitterStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
