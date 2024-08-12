import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { ProjectService } from './project.service'
import { ProjectController } from './project.controller'
import { UserModule } from '../user/user.module'
import { ActionTokensModule } from '../action-tokens/action-tokens.module'
import { MailerModule } from '../mailer/mailer.module'
import { AppLoggerModule } from '../logger/logger.module'
import { Project, ProjectSubscriber, Funnel, ProjectShare } from './entity'
import { ProjectsViewsRepository } from './repositories/projects-views.repository'
import { ProjectViewEntity } from './entity/project-view.entity'
import { ProjectViewCustomEventEntity } from './entity/project-view-custom-event.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectShare,
      ProjectSubscriber,
      Funnel,
      ProjectViewEntity,
      ProjectViewCustomEventEntity,
    ]),
    forwardRef(() => UserModule),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('AI_URL'),
      }),
    }),
    AppLoggerModule,
    ActionTokensModule,
    MailerModule,
  ],
  providers: [ProjectService, ProjectsViewsRepository],
  exports: [ProjectService, ProjectsViewsRepository],
  controllers: [ProjectController],
})
export class ProjectModule {}
