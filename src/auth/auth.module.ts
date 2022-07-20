import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { MailerModule } from '../mailer/mailer.module';
import { ProjectModule } from '../project/project.module';
import { ActionTokensModule } from '../action-tokens/action-tokens.module';
import { AppLoggerModule } from '../logger/logger.module';
import { RefreshTokensModule } from 'src/refresh-tokens/refresh-token.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    MailerModule,
    ActionTokensModule,
    AppLoggerModule,
    ProjectModule,
    RefreshTokensModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
