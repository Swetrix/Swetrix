import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AlertModule } from '../alert/alert.module'
import { ExtensionsModule } from '../marketplace/extensions/extensions.module'
import { TelegramService } from '../integrations/telegram/telegram.service'
import { TaskManagerService } from './task-manager.service'
import { MailerModule } from '../mailer/mailer.module'
import { UserModule } from '../user/user.module'
import { ProjectModule } from '../project/project.module'
import { AnalyticsModule } from '../analytics/analytics.module'
import { PayoutsModule } from '../payouts/payouts.module'
import { ActionTokensModule } from '../action-tokens/action-tokens.module'
import { AppLoggerModule } from '../logger/logger.module'
import { Message } from '../integrations/telegram/entities/message.entity'

@Module({
  imports: [
    ProjectModule,
    MailerModule,
    UserModule,
    ActionTokensModule,
    AlertModule,
    forwardRef(() => AnalyticsModule),
    ExtensionsModule,
    AppLoggerModule,
    TypeOrmModule.forFeature([Message]),
    PayoutsModule,
  ],
  providers: [TaskManagerService, TelegramService],
  exports: [TaskManagerService],
})
export class TaskManagerModule {}
