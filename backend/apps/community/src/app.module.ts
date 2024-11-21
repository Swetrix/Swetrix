import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { NestjsFormDataModule } from 'nestjs-form-data'

import { I18nModule } from 'nestjs-i18n'
import { UserModule } from './user/user.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { ProjectModule } from './project/project.module'
import { TaskManagerModule } from './task-manager/task-manager.module'
import { PingModule } from './ping/ping.module'
import { getI18nConfig } from './configs'
import { AuthModule } from './auth/auth.module'
import { AppController } from './app.controller'
import { isPrimaryNode } from './common/utils'

const modules = [
  ConfigModule.forRoot({
    cache: true,
    envFilePath: '.env',
    expandVariables: true,
    isGlobal: true,
  }),
  I18nModule.forRootAsync(getI18nConfig()),
  ScheduleModule.forRoot(),
  NestjsFormDataModule.config({ isGlobal: true }),
  UserModule,
  ProjectModule,
  AnalyticsModule,
  PingModule,
  AuthModule,
]

@Module({
  imports: [...modules, ...(isPrimaryNode() ? [TaskManagerModule] : [])],
  controllers: [AppController],
})
export class AppModule {}
