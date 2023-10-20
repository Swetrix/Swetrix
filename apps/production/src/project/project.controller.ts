import {
  Controller,
  Body,
  Query,
  Param,
  UseGuards,
  Get,
  Post,
  Put,
  Delete,
  BadRequestException,
  HttpCode,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Headers,
  Header,
  Patch,
  ConflictException,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { Response } from 'express'
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { ILike } from 'typeorm'
import * as _isEmpty from 'lodash/isEmpty'
import * as _map from 'lodash/map'
import * as _trim from 'lodash/trim'
import * as _size from 'lodash/size'
import * as _includes from 'lodash/includes'
import * as _isBoolean from 'lodash/isBoolean'
import * as _omit from 'lodash/omit'
import * as _split from 'lodash/split'
import * as _head from 'lodash/head'
import * as _filter from 'lodash/filter'
import * as dayjs from 'dayjs'

import { hash } from 'bcrypt'
import { JwtAccessTokenGuard } from '../auth/guards'
import { Auth, Public } from '../auth/decorators'
import { isValidDate } from '../analytics/analytics.service'
import {
  ProjectService,
  processProjectUser,
  deleteProjectRedis,
  generateProjectId,
} from './project.service'
import { UserType, PlanCode } from '../user/entities/user.entity'
import { ActionTokenType } from '../action-tokens/action-token.entity'
import { ActionTokensService } from '../action-tokens/action-tokens.service'
import { MailerService } from '../mailer/mailer.service'
import { LetterTemplate } from '../mailer/letter'
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Pagination } from '../common/pagination/pagination'
import { Project } from './entity/project.entity'
import { ProjectShare, roles } from './entity/project-share.entity'
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator'
import { UserService } from '../user/user.service'
import { AppLoggerService } from '../logger/logger.service'
import {
  isValidPID,
  clickhouse,
  PROJECT_INVITE_EXPIRE,
  CAPTCHA_SECRET_KEY_LENGTH,
  isDevelopment,
  PRODUCTION_ORIGIN,
  MAX_FUNNELS,
} from '../common/constants'
import { generateRandomString } from '../common/utils'
import {
  AddSubscriberParamsDto,
  AddSubscriberBodyDto,
  ConfirmSubscriberInviteParamsDto,
  ConfirmSubscriberInviteQueriesDto,
  GetSubscribersParamsDto,
  GetSubscribersQueriesDto,
  UpdateSubscriberParamsDto,
  UpdateSubscriberBodyDto,
  RemoveSubscriberParamsDto,
  TransferProjectBodyDto,
  ConfirmTransferProjectQueriesDto,
  CancelTransferProjectQueriesDto,
  UpdateProjectDto,
  CreateProjectDTO,
  ProjectDTO,
  ShareDTO,
  ShareUpdateDTO,
  FunnelCreateDTO,
  FunnelUpdateDTO,
} from './dto'

const PROJECTS_MAXIMUM = 50

const isValidShareDTO = (share: ShareDTO): boolean => {
  return !_isEmpty(_trim(share.email)) && _includes(roles, share.role)
}

const isValidUpdateShareDTO = (share: ShareUpdateDTO): boolean => {
  return _includes(roles, share.role)
}

@ApiTags('Project')
@Controller(['project', 'v1/project'])
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly logger: AppLoggerService,
    private readonly actionTokensService: ActionTokensService,
    private readonly mailerService: MailerService,
  ) {}

  @Get('/')
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'isCaptcha', required: false, type: Boolean })
  @ApiQuery({ name: 'relatedonly', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: [Project] })
  @Auth([UserType.CUSTOMER, UserType.ADMIN], true)
  async get(
    @CurrentUserId() userId: string,
    @Query('take') take: number | undefined,
    @Query('skip') skip: number | undefined,
    @Query('isCaptcha') isCaptchaStr: string | undefined,
    @Query('search') search: string | undefined,
  ): Promise<Pagination<Project> | Project[] | object> {
    this.logger.log({ userId, take, skip }, 'GET /project')
    const isCaptcha = isCaptchaStr === 'true'

    let where: any

    if (search) {
      where = [
        {
          admin: userId,
          isCaptchaProject: isCaptcha,
          isAnalyticsProject: !isCaptcha,
          name: ILike(`%${search}%`),
          // name: ILike(`%${mysql.escape(search).slice(1, 0).slice(0, -1)}%`),
        },
        {
          admin: userId,
          isCaptchaProject: isCaptcha,
          isAnalyticsProject: !isCaptcha,
          id: ILike(`%${search}%`),
          // id: ILike(`%${mysql.escape(search).slice(1, 0).slice(0, -1)}%`),
        },
      ]
    } else {
      where = {
        admin: userId,
      }

      if (isCaptcha) {
        where.isCaptchaProject = true
      } else {
        where.isAnalyticsProject = true
      }
    }

    const paginated = await this.projectService.paginate({ take, skip }, where)

    const totalMonthlyEvents = await this.projectService.getRedisCount(userId)

    paginated.results = _map(paginated.results, p => ({
      ...p,
      isOwner: true,
    }))

    return {
      ...paginated,
      totalMonthlyEvents,
    }
  }

  @Get('/names')
  @ApiResponse({ status: 200, type: [Project] })
  @Auth([UserType.CUSTOMER, UserType.ADMIN], true)
  async getNames(@CurrentUserId() userId: string): Promise<Project[]> {
    this.logger.log({ userId }, 'GET /project/names')

    const where = Object()
    where.admin = userId

    const projects = await this.projectService.find(where)

    return _map(projects, (p: Project) => ({
      id: p.id,
      name: p.name,
      isCaptchaProject: p.isCaptchaProject,
    }))
  }

  @Get('/shared')
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'relatedonly', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: [Project] })
  @Auth([UserType.CUSTOMER, UserType.ADMIN], true)
  async getShared(
    @CurrentUserId() userId: string,
    @Query('take') take: number | undefined,
    @Query('skip') skip: number | undefined,
    @Query('search') search: string | undefined,
  ): Promise<Pagination<ProjectShare> | ProjectShare[] | object> {
    this.logger.log({ userId, take, skip, search }, 'GET /project/shared')

    let where = Object()

    if (search) {
      where = [
        {
          user: userId,
          project: {
            name: ILike(`%${search}%`),
          },
        },
        {
          user: userId,
          project: {
            id: ILike(`%${search}%`),
          },
        },
      ]
    } else {
      where.user = userId
    }

    const paginated = await this.projectService.paginateShared(
      { take, skip },
      where,
    )

    return paginated
  }

  @Get('/all')
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Auth([UserType.ADMIN])
  @ApiResponse({ status: 200, type: Project })
  async getAllProjects(
    @Query('take') take: number | undefined,
    @Query('skip') skip: number | undefined,
  ): Promise<Project | object> {
    this.logger.log({ take, skip }, 'GET /all')

    const where = Object()
    return this.projectService.paginate({ take, skip }, where)
  }

  @Get('/user/:id')
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'relatedonly', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [Project] })
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  async getUserProject(
    @Param('id') userId: string,
    @Query('take') take: number | undefined,
    @Query('skip') skip: number | undefined,
  ): Promise<Pagination<Project> | Project[] | object> {
    this.logger.log({ userId, take, skip }, 'GET /user/:id')

    const where = Object()
    where.admin = userId

    const paginated = await this.projectService.paginate({ take, skip }, where)
    const totalMonthlyEvents = await this.projectService.getRedisCount(userId)

    return {
      ...paginated,
      totalMonthlyEvents,
    }
  }

  @Post('/admin/:id')
  @ApiResponse({ status: 201, type: Project })
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  async createForAdmin(
    @Param('id') userId: string,
    @Body() projectDTO: ProjectDTO,
  ): Promise<Project> {
    this.logger.log({ userId, projectDTO }, 'POST /project/admin/:id')

    const user = await this.userService.findOneWithRelations(userId, [
      'projects',
    ])
    const { maxProjects = PROJECTS_MAXIMUM } = user

    if (!user.isActive) {
      throw new ForbiddenException(
        "User's email address has to be verified first",
      )
    }

    if (_size(user.projects) >= maxProjects) {
      throw new ForbiddenException(
        `The user's plan supports maximum of ${maxProjects} projects`,
      )
    }

    this.projectService.validateProject(projectDTO)
    await this.projectService.checkIfIDUnique(projectDTO.id)

    try {
      const project = new Project()
      Object.assign(project, projectDTO)
      project.origins = _map(projectDTO.origins, _trim)

      const newProject = await this.projectService.create(project)
      user.projects.push(project)

      await this.userService.create(user)

      return newProject
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        if (e.sqlMessage.includes(projectDTO.id)) {
          throw new BadRequestException(
            'Project with selected ID already exists',
          )
        }
      }

      throw new BadRequestException(e)
    }
  }

  @Post('/')
  @ApiResponse({ status: 201, type: Project })
  @Auth([], true)
  async create(
    @Body() projectDTO: CreateProjectDTO,
    @CurrentUserId() userId: string,
  ): Promise<Project> {
    this.logger.log({ projectDTO, userId }, 'POST /project')

    if (!userId) {
      throw new UnauthorizedException('Please auth first')
    }

    const user = await this.userService.findOneWithRelations(userId, [
      'projects',
    ])
    const { maxProjects = PROJECTS_MAXIMUM } = user

    if (!user.isActive) {
      throw new ForbiddenException('Please, verify your email address first')
    }

    if (user.planCode === PlanCode.none) {
      throw new HttpException(
        'You cannot create new projects due to no active subscription. Please upgrade your account plan to continue.',
        HttpStatus.PAYMENT_REQUIRED,
      )
    }

    if (projectDTO.isCaptcha) {
      if (
        _size(
          _filter(
            user.projects,
            (project: Project) => project.isCaptchaProject,
          ) >= maxProjects,
        )
      ) {
        throw new HttpException(
          `You cannot create more than ${maxProjects} projects on your account plan. Please upgrade to be able to create more projects.`,
          HttpStatus.PAYMENT_REQUIRED,
        )
      }
    } else if (
      _size(
        _filter(
          user.projects,
          (project: Project) => project.isAnalyticsProject,
        ) >= maxProjects,
      )
    ) {
      throw new ForbiddenException(
        `You cannot create more than ${maxProjects} projects on your account plan. Please upgrade to be able to create more projects.`,
      )
    }

    this.projectService.validateProject(projectDTO as ProjectDTO, true)

    let pid = generateProjectId()

    // eslint-disable-next-line no-await-in-loop
    while (!(await this.projectService.isPIDUnique(pid))) {
      pid = generateProjectId()
    }

    try {
      const project = new Project()
      project.id = pid
      project.name = _trim(projectDTO.name)
      project.origins = []

      if (projectDTO.isCaptcha) {
        project.isCaptchaProject = true
        project.isAnalyticsProject = false
        project.isCaptchaEnabled = true
        project.captchaSecretKey = generateRandomString(
          CAPTCHA_SECRET_KEY_LENGTH,
        )
      }

      if (projectDTO.isPasswordProtected && projectDTO.password) {
        project.isPasswordProtected = true
        project.passwordHash = await hash(projectDTO.password, 10)
      }

      if (projectDTO.public) {
        project.public = Boolean(projectDTO.public)
      }

      if (projectDTO.active) {
        project.active = Boolean(projectDTO.active)
      }

      if (projectDTO.origins) {
        this.projectService.validateOrigins(projectDTO)
        project.origins = projectDTO.origins
      }

      if (projectDTO.ipBlacklist) {
        this.projectService.validateIPBlacklist(projectDTO)
        project.ipBlacklist = projectDTO.ipBlacklist
      }

      const newProject = await this.projectService.create(project)
      user.projects.push(project)

      await this.userService.create(user)

      return _omit(newProject, ['passwordHash'])
    } catch (reason) {
      console.error('[ERROR] Failed to create a new project:')
      console.error(reason)
      throw new BadRequestException('Failed to create a new project')
    }
  }

  @Post('/funnel')
  @ApiResponse({ status: 201 })
  @Auth([], true)
  async createFunnel(
    @Body() funnelDTO: FunnelCreateDTO,
    @CurrentUserId() userId: string,
  ): Promise<any> {
    this.logger.log({ funnelDTO, userId }, 'POST /project/funnel')

    if (!userId) {
      throw new UnauthorizedException('Please auth first')
    }

    const user = await this.userService.findOneWithRelations(userId, [
      'projects',
    ])

    if (!user.isActive) {
      throw new ForbiddenException('Please, verify your email address first')
    }

    if (user.planCode === PlanCode.none) {
      throw new HttpException(
        'You cannot create new funnels due to no active subscription. Please upgrade your account plan to continue.',
        HttpStatus.PAYMENT_REQUIRED,
      )
    }

    const project = await this.projectService.findOneWhere(
      {
        id: funnelDTO.pid,
        admin: userId,
      },
      {
        relations: ['admin', 'share'],
      },
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    this.projectService.allowedToManage(project, userId, user.roles)

    return this.projectService.createFunnel(project.id, funnelDTO)
  }

  @Patch('/funnel')
  @ApiResponse({ status: 200 })
  @Auth([], true)
  async updateFunnel(
    @Body() funnelDTO: FunnelUpdateDTO,
    @CurrentUserId() userId: string,
  ): Promise<any> {
    this.logger.log({ funnelDTO, userId }, 'PATCH /project/funnel')

    if (!userId) {
      throw new UnauthorizedException('Please auth first')
    }

    const user = await this.userService.findOneWithRelations(userId, [
      'projects',
    ])

    if (!user.isActive) {
      throw new ForbiddenException('Please, verify your email address first')
    }

    if (user.planCode === PlanCode.none) {
      throw new HttpException(
        'You cannot update funnels due to no active subscription. Please upgrade your account plan to continue.',
        HttpStatus.PAYMENT_REQUIRED,
      )
    }

    const project = await this.projectService.findOneWhere(
      {
        id: funnelDTO.pid,
        admin: userId,
      },
      {
        relations: ['admin', 'share', 'funnels'],
      },
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    this.projectService.allowedToManage(project, userId, user.roles)

    if (_size(project.funnels) >= MAX_FUNNELS) {
      throw new ForbiddenException(
        `You cannot create more than ${MAX_FUNNELS}. Please contact us to increase the limit.`,
      )
    }

    const oldFunnel = await this.projectService.getFunnel(
      funnelDTO.id,
      project.id,
    )

    if (!oldFunnel) {
      throw new NotFoundException('Funnel not found.')
    }

    return this.projectService.updateFunnel({
      id: funnelDTO.id,
      name: funnelDTO.name,
      steps: funnelDTO.steps,
    } as FunnelUpdateDTO)
  }

  @Delete('/funnel/:id/:pid')
  @ApiResponse({ status: 200 })
  @Auth([], true)
  async deleteFunnel(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    this.logger.log({ id, userId }, 'PATCH /project/funnel')

    if (!userId) {
      throw new UnauthorizedException('Please auth first')
    }

    const project = await this.projectService.findOneWhere(
      {
        id: pid,
        admin: userId,
      },
      {
        relations: ['admin', 'share'],
      },
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    this.projectService.allowedToManage(project, userId)

    const oldFunnel = await this.projectService.getFunnel(id, project.id)

    if (!oldFunnel) {
      throw new NotFoundException('Funnel not found.')
    }

    await this.projectService.deleteFunnel(id)
  }

  @Get('/funnels/:pid')
  @ApiResponse({ status: 200 })
  @Auth([], true)
  async getFunnels(
    @Param('pid') pid: string,
    @CurrentUserId() userId: string,
    @Headers() headers: { 'x-password'?: string },
  ): Promise<any> {
    this.logger.log({ pid, userId }, 'PATCH /project/funnel')

    if (!userId) {
      throw new UnauthorizedException('Please auth first')
    }

    const project = await this.projectService.getProject(pid, userId)

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    this.projectService.allowedToView(project, userId, headers['x-password'])

    return this.projectService.getFunnels(project.id)
  }

  @Delete('/reset/:id')
  @HttpCode(204)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 204, description: 'Empty body' })
  async reset(
    @Param('id') id: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, id }, 'DELETE /project/reset/:id')
    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const user = await this.userService.findOne(uid)
    const project = await this.projectService.findOneWhere(
      { id },
      {
        relations: ['admin'],
        select: ['id'],
      },
    )

    if (_isEmpty(project)) {
      throw new NotFoundException(`Project with ID ${id} does not exist`)
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    const query1 = `ALTER table analytics DELETE WHERE pid='${id}'`
    const query2 = `ALTER table customEV DELETE WHERE pid='${id}'`

    try {
      await clickhouse.query(query1).toPromise()
      await clickhouse.query(query2).toPromise()
      return 'Project resetted successfully'
    } catch (e) {
      this.logger.error(e)
      return 'Error while resetting your project'
    }
  }

  @Delete('/captcha/reset/:id')
  @HttpCode(204)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 204, description: 'Empty body' })
  async resetCAPTCHA(
    @Param('id') id: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, id }, 'DELETE /project/captcha/reset/:id')
    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const query = `ALTER table captcha DELETE WHERE pid='${id}'`

    const user = await this.userService.findOne(uid)
    const project = await this.projectService.findOneWhere(
      { id },
      {
        relations: ['admin'],
        select: ['id'],
      },
    )

    if (_isEmpty(project)) {
      throw new NotFoundException(`Project with ID ${id} does not exist`)
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    try {
      await clickhouse.query(query).toPromise()
      return 'CAPTCHA project resetted successfully'
    } catch (e) {
      this.logger.error(e)
      return 'Error while resetting your CAPTCHA project'
    }
  }

  @Post('/secret-gen/:pid')
  @HttpCode(200)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 200, description: 'A regenerated CAPTCHA secret key' })
  async secretGen(
    @Param('pid') pid: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, pid }, 'POST /project/secret-gen/:pid')

    if (!isValidPID(pid)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOne(pid, {
      relations: ['admin'],
    })
    const user = await this.userService.findOne(uid)

    if (_isEmpty(project)) {
      throw new NotFoundException()
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    const secret = generateRandomString(CAPTCHA_SECRET_KEY_LENGTH)

    // @ts-ignore
    await this.projectService.update(pid, { captchaSecretKey: secret })

    await deleteProjectRedis(pid)

    return secret
  }

  @Delete('/captcha/:id')
  @HttpCode(204)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 204, description: 'Empty body' })
  async deleteCAPTCHA(
    @Param('id') id: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, id }, 'DELETE /project/captcha/:id')

    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const user = await this.userService.findOne(uid)
    const project = await this.projectService.findOneWhere(
      { id },
      {
        relations: ['admin'],
        select: ['id'],
      },
    )

    if (_isEmpty(project)) {
      throw new NotFoundException(`Project with ID ${id} does not exist`)
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    const query = `ALTER table captcha DELETE WHERE pid='${id}'`

    try {
      await clickhouse.query(query).toPromise()

      project.captchaSecretKey = null
      project.isCaptchaEnabled = false
      project.isCaptchaProject = false

      await this.projectService.update(id, project)

      return 'CAPTCHA project deleted successfully'
    } catch (e) {
      this.logger.error(e)
      return 'Error while deleting your CAPTCHA project'
    }
  }

  @Delete('/partially/:pid')
  @ApiQuery({
    name: 'from',
    required: true,
    description: 'Date in ISO format',
    example: '2020-01-01T00:00:00.000Z',
    type: 'string',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    description: 'Date in ISO format',
    example: '2020-01-01T00:00:00.000Z',
    type: 'string',
  })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async deletePartially(
    @Param('pid') pid: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUserId() uid: string,
  ): Promise<void> {
    this.logger.log({ from, to, pid }, 'DELETE /partially/:id')

    if (!isValidPID(pid)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    from = _head(_split(from, 'T'))
    to = _head(_split(to, 'T'))

    if (!isValidDate(from)) {
      throw new BadRequestException("The provided 'from' date is incorrect")
    }

    if (!isValidDate(to)) {
      throw new BadRequestException("The provided 'to' date is incorrect")
    }

    const project = await this.projectService.findOne(pid, {
      relations: ['admin', 'share'],
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    this.projectService.allowedToManage(project, uid)

    from = dayjs(from).format('YYYY-MM-DD')
    to = dayjs(to).format('YYYY-MM-DD 23:59:59')

    await this.projectService.removeDataFromClickhouse(pid, from, to)
  }

  @Delete('/reset-filters/:pid')
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async resetFilters(
    @Param('pid') pid: string,
    @Query('type') type: string,
    @Query('filters') rawFilters: string,
    @CurrentUserId() uid: string,
  ): Promise<void> {
    this.logger.log({ pid }, 'DELETE /reset-filters/:pid')

    if (!isValidPID(pid)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOne(pid, {
      relations: ['admin', 'share'],
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    this.projectService.allowedToManage(project, uid)

    const filters = JSON.parse(rawFilters)

    await this.projectService.deleteByFilters(pid, type, filters)
  }

  @Post('/:pid/share')
  @HttpCode(200)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 200, type: Project })
  async share(
    @Param('pid') pid: string,
    @Body() shareDTO: ShareDTO,
    @CurrentUserId() uid: string,
    @Headers() headers,
  ): Promise<Project> {
    this.logger.log({ uid, pid, shareDTO }, 'POST /project/:pid/share')

    if (!isValidPID(pid)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    if (!isValidShareDTO(shareDTO)) {
      throw new BadRequestException('The provided ShareDTO is incorrect')
    }

    const user = await this.userService.findOne(uid)
    const project = await this.projectService.findOneWhere(
      { id: pid },
      {
        relations: ['admin', 'share'],
        select: ['id', 'admin', 'share'],
      },
    )

    if (_isEmpty(project)) {
      throw new NotFoundException(`Project with ID ${pid} does not exist`)
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    const invitee = await this.userService.findOneWhere(
      {
        email: shareDTO.email,
      },
      ['sharedProjects'],
    )

    if (!invitee) {
      throw new NotFoundException(
        `User with email ${shareDTO.email} is not registered on Swetrix`,
      )
    }

    if (invitee.id === user.id) {
      throw new BadRequestException('You cannot share with yourself')
    }

    const isSharingWithUser = !_isEmpty(
      await this.projectService.findShare({
        where: {
          project: project.id,
          user: invitee.id,
        },
      }),
    )

    if (isSharingWithUser) {
      throw new BadRequestException(
        `You're already sharing the project with ${invitee.email}`,
      )
    }

    try {
      const share = new ProjectShare()
      share.role = shareDTO.role
      share.user = invitee
      share.project = project

      await this.projectService.createShare(share)

      // Saving share into project
      project.share.push(share)
      await this.projectService.create(project)

      // Saving share into invitees shared projects
      invitee.sharedProjects.push(share)
      await this.userService.create(invitee)

      // TODO: Implement link expiration
      const actionToken = await this.actionTokensService.createForUser(
        user,
        ActionTokenType.PROJECT_SHARE,
        share.id,
      )
      const url = `${
        isDevelopment ? headers.origin : PRODUCTION_ORIGIN
      }/share/${actionToken.id}`
      await this.mailerService.sendEmail(
        invitee.email,
        LetterTemplate.ProjectInvitation,
        {
          url,
          email: user.email,
          name: project.name,
          role: share.role,
          expiration: PROJECT_INVITE_EXPIRE,
        },
      )

      const updatedProject = await this.projectService.findOne(pid, {
        relations: ['share', 'share.user'],
      })

      // todo: maybe the update project should be used here instead of delete?
      await deleteProjectRedis(pid)
      return processProjectUser(updatedProject)
    } catch (e) {
      console.error(
        `[ERROR] Could not share project (pid: ${project.id}, invitee ID: ${invitee.id}): ${e}`,
      )
      throw new BadRequestException(e)
    }
  }

  @Put('/share/:shareId')
  @HttpCode(200)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 200, type: Project })
  async updateShare(
    @Param('shareId') shareId: string,
    @Body() shareDTO: ShareUpdateDTO,
    @CurrentUserId() uid: string,
  ): Promise<ProjectShare> {
    this.logger.log({ uid, shareDTO, shareId }, 'PUT /project/share/:shareId')

    if (!isValidUpdateShareDTO(shareDTO)) {
      throw new BadRequestException('The provided ShareUpdateDTO is incorrect')
    }

    const user = await this.userService.findOne(uid)
    const share = await this.projectService.findOneShare(shareId, {
      relations: ['project', 'project.admin'],
    })

    if (_isEmpty(share)) {
      throw new NotFoundException(`Share with ID ${shareId} does not exist`)
    }

    if (share.project?.admin?.id !== uid) {
      throw new NotFoundException(`You are not allowed to edit this share`)
    }

    this.projectService.allowedToManage(share.project, uid, user.roles)

    const { role } = shareDTO
    await this.projectService.updateShare(shareId, {
      role,
    })

    await deleteProjectRedis(share.project.id)
    return this.projectService.findOneShare(shareId)
  }

  @HttpCode(204)
  // @UseGuards(JwtAccessTokenGuard, RolesGuard)
  // @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @Public()
  @ApiResponse({ status: 204, description: 'Empty body' })
  @Get('/share/:id')
  async acceptShare(@Param('id') id: string): Promise<any> {
    this.logger.log({ id }, 'GET /project/share/:id')
    let actionToken

    try {
      actionToken = await this.actionTokensService.find(id)
    } catch {
      throw new BadRequestException('Incorrect token provided')
    }

    if (actionToken.action === ActionTokenType.PROJECT_SHARE) {
      const { newValue: shareId, id: tokenID } = actionToken

      const share = await this.projectService.findOneShare(shareId)
      share.confirmed = true

      if (_isEmpty(share)) {
        throw new BadRequestException('The provided share ID is not valid')
      }

      // if (share.user?.id !== user.id) {
      //   throw new BadRequestException('You are not allowed to manage this share')
      // }

      await this.projectService.updateShare(shareId, share)
      await this.actionTokensService.delete(tokenID)
    }
  }

  @Post('transfer')
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async transferProject(
    @Body() body: TransferProjectBodyDto,
    @CurrentUserId() userId: string,
    @Headers() headers: { origin: string },
  ) {
    this.logger.log({ body }, 'POST /project/transfer')

    const project = await this.projectService.getOwnProject(
      body.projectId,
      userId,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    const user = await this.userService.getUserByEmail(body.email)

    if (!user) {
      throw new NotFoundException('User not found.')
    }

    if (user.id === userId) {
      throw new ConflictException('You cannot transfer project to yourself.')
    }

    await this.projectService.transferProject(
      body.projectId,
      project.name,
      user.id,
      user.email,
      headers.origin,
    )
  }

  @Get('transfer')
  async confirmTransferProject(
    @Query() queries: ConfirmTransferProjectQueriesDto,
  ) {
    this.logger.log({ queries }, 'GET /project/transfer')

    const actionToken = await this.actionTokensService.getActionToken(
      queries.token,
    )

    if (
      !actionToken ||
      actionToken.action !== ActionTokenType.TRANSFER_PROJECT
    ) {
      throw new BadRequestException('Invalid token.')
    }

    const project = await this.projectService.getProjectById(
      actionToken.newValue,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    await this.projectService.confirmTransferProject(
      actionToken.newValue,
      actionToken.user.id,
      project.admin.id,
      actionToken.id,
    )
  }

  @Delete('transfer')
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async cancelTransferProject(
    @Query() queries: CancelTransferProjectQueriesDto,
  ) {
    this.logger.log({ queries }, 'DELETE /project/transfer')

    const actionToken = await this.actionTokensService.getActionToken(
      queries.token,
    )

    if (
      !actionToken ||
      actionToken.action !== ActionTokenType.TRANSFER_PROJECT
    ) {
      throw new BadRequestException('Invalid token.')
    }

    const project = await this.projectService.getProjectById(
      actionToken.newValue,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    await this.projectService.cancelTransferProject(actionToken.id, project.id)
  }

  @Delete(':projectId/subscribers/:subscriberId')
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async removeSubscriber(
    @Param() params: RemoveSubscriberParamsDto,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    this.logger.log(
      { params },
      'DELETE /project/:projectId/subscribers/:subscriberId',
    )

    const project = await this.projectService.getProject(
      params.projectId,
      userId,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    const subscriber = await this.projectService.getSubscriber(
      params.projectId,
      params.subscriberId,
    )

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found.')
    }

    await this.projectService.removeSubscriber(
      params.projectId,
      params.subscriberId,
    )
  }

  @Post(':projectId/subscribers')
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async addSubscriber(
    @Param() params: AddSubscriberParamsDto,
    @Body() body: AddSubscriberBodyDto,
    @Headers() headers: { origin: string },
    @CurrentUserId() userId: string,
  ) {
    this.logger.log({ params, body }, 'POST /project/:projectId/subscribers')
    const project = await this.projectService.getProject(
      params.projectId,
      userId,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    const user = await this.userService.getUser(userId)

    if (user.email === body.email) {
      throw new BadRequestException('You cannot subscribe to your own project.')
    }

    const subscriber = await this.projectService.getSubscriberByEmail(
      params.projectId,
      body.email,
    )

    if (subscriber) {
      throw new BadRequestException('Subscriber already exists.')
    }

    return this.projectService.addSubscriber({
      userId,
      projectId: params.projectId,
      projectName: project.name,
      email: body.email,
      reportFrequency: body.reportFrequency,
      origin: isDevelopment ? headers.origin : PRODUCTION_ORIGIN,
    })
  }

  @Get('password/:projectId')
  @Auth([], true, true)
  @ApiResponse({ status: 200, type: Project })
  async checkPassword(
    @Param('projectId') projectId: string,
    @CurrentUserId() userId: string,
    @Headers() headers: { 'x-password'?: string },
  ): Promise<boolean> {
    this.logger.log({ projectId }, 'GET /project/password/:projectId')

    const project = await this.projectService.getProjectById(projectId)

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    try {
      this.projectService.allowedToView(project, userId, headers['x-password'])
    } catch {
      return false
    }

    return true
  }

  @Get(':projectId/subscribers/invite')
  @HttpCode(HttpStatus.OK)
  async confirmSubscriberInvite(
    @Param() params: ConfirmSubscriberInviteParamsDto,
    @Query() queries: ConfirmSubscriberInviteQueriesDto,
  ): Promise<void> {
    this.logger.log(
      { params, queries },
      'GET /project/:projectId/subscribers/invite',
    )
    const project = await this.projectService.getProjectById(params.projectId)

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    const actionToken = await this.actionTokensService.getActionToken(
      queries.token,
    )

    if (
      !actionToken ||
      actionToken.action !== ActionTokenType.ADDING_PROJECT_SUBSCRIBER
    ) {
      throw new BadRequestException('Invalid token.')
    }

    const [projectId, subscriberId] = actionToken.newValue.split(':')
    const subscriber = await this.projectService.getSubscriber(
      projectId,
      subscriberId,
    )

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found.')
    }

    await this.projectService.confirmSubscriber(
      projectId,
      subscriberId,
      actionToken.id,
    )
  }

  @Get(':projectId/subscribers')
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async getSubscribers(
    @Param() params: GetSubscribersParamsDto,
    @Query() queries: GetSubscribersQueriesDto,
    @CurrentUserId() userId: string,
  ) {
    this.logger.log({ params, queries }, 'GET /project/:projectId/subscribers')
    const project = await this.projectService.getProject(
      params.projectId,
      userId,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    return this.projectService.getSubscribers(params.projectId, queries)
  }

  @Patch(':projectId/subscribers/:subscriberId')
  @Auth([UserType.ADMIN, UserType.CUSTOMER])
  async updateSubscriber(
    @Param() params: UpdateSubscriberParamsDto,
    @Body() body: UpdateSubscriberBodyDto,
    @CurrentUserId() userId: string,
  ) {
    this.logger.log(
      { params, body },
      'PATCH /project/:projectId/subscribers/:subscriberId',
    )

    const project = await this.projectService.getProject(
      params.projectId,
      userId,
    )

    if (!project) {
      throw new NotFoundException('Project not found.')
    }

    const subscriber = await this.projectService.getSubscriber(
      params.projectId,
      params.subscriberId,
    )

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found.')
    }

    return this.projectService.updateSubscriber(
      params.projectId,
      params.subscriberId,
      body,
    )
  }

  @Delete('/:id')
  @HttpCode(204)
  @Auth([], true)
  @ApiResponse({ status: 204, description: 'Empty body' })
  async delete(
    @Param('id') id: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, id }, 'DELETE /project/:id')

    if (!uid) {
      throw new UnauthorizedException('Please auth first')
    }

    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }
    const user = await this.userService.findOne(uid)
    const project = await this.projectService.findOneWhere(
      { id },
      {
        relations: ['admin'],
        select: ['id'],
      },
    )

    if (_isEmpty(project)) {
      throw new NotFoundException(`Project with ID ${id} does not exist`)
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    const query1 = `ALTER table analytics DELETE WHERE pid='${id}'`
    const query2 = `ALTER table customEV DELETE WHERE pid='${id}'`

    try {
      await clickhouse.query(query1).toPromise()
      await clickhouse.query(query2).toPromise()
      await deleteProjectRedis(id)
    } catch (e) {
      this.logger.error(e)
      return 'Error while deleting your project'
    }

    try {
      if (project.isCaptchaProject) {
        project.isAnalyticsProject = false
        await this.projectService.update(id, project)
      } else {
        await this.projectService.deleteMultipleShare(`project = "${id}"`)
        await this.projectService.delete(id)
        await this.deleteCAPTCHA(id, uid)
      }
    } catch (e) {
      this.logger.error(e)
      return 'Error while deleting your project'
    }

    return 'Project deleted successfully'
  }

  @Put('captcha/inherited/:id')
  @HttpCode(200)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 200, type: Project })
  async createCaptchaInherited(
    @Param('id') id: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, id }, 'PUT /project/captcha/inherited/:id')

    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOne(id, {
      relations: ['admin', 'share', 'share.user'],
    })
    const user = await this.userService.findOne(uid)

    if (_isEmpty(project)) {
      throw new NotFoundException()
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    if (project.isCaptchaProject) {
      throw new BadRequestException('This project is already a CAPTCHA project')
    }

    if (project.isAnalyticsProject) {
      const captchaProjects = _filter(
        user.projects,
        (fProject: Project) => fProject.isCaptchaProject,
      )
      const { maxProjects = PROJECTS_MAXIMUM } = user

      if (_size(captchaProjects >= maxProjects)) {
        throw new ForbiddenException(
          `You cannot create more than ${maxProjects} projects on your account plan. Please upgrade to be able to create more projects.`,
        )
      }

      project.isCaptchaProject = true
      project.isCaptchaEnabled = true
    }

    await this.projectService.update(id, _omit(project, ['share', 'admin']))

    return _omit(project, ['passwordHash'])
  }

  @Get('/ogimage/:id')
  @HttpCode(200)
  @Header('Content-Type', 'image/png')
  // 1 day cache
  @Header(
    'Cache-Control',
    'immutable, no-transform, s-max-age=86400, max-age=86400',
  )
  @ApiResponse({ status: 200 })
  async getOgImage(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<any> {
    // TODO: Cache the generated image in the filesystem (or CDN) for 1 day and return it instead of generating it again
    this.logger.log({ id }, 'GET /project/ogimage/:id')

    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOne(id)

    if (_isEmpty(project)) {
      // TODO: Return default image
      throw new NotFoundException('Project not found.')
    }

    if (!project.public) {
      // TODO: Return default image
      throw new ForbiddenException()
    }

    const image = await this.projectService.getOgImage(project.id, project.name)

    res.end(image)
  }

  @Get('/ogimage/:id/html')
  @HttpCode(200)
  @ApiResponse({ status: 200 })
  async getOgHTML(@Param('id') id: string, @Res() res: Response): Promise<any> {
    this.logger.log({ id }, 'GET /project/ogimage/:id')

    if (!isDevelopment) {
      throw new ForbiddenException('This route is only available in dev mode')
    }

    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOne(id)

    if (_isEmpty(project)) {
      throw new NotFoundException('Project not found')
    }

    const html = this.projectService.getOgHTML('My Awesome Project')

    res.send(html)
  }

  @Put('/:id')
  @HttpCode(200)
  @Auth([], true)
  @ApiResponse({ status: 200, type: Project })
  async update(
    @Param('id') id: string,
    @Body() projectDTO: UpdateProjectDto,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log(
      { ..._omit(projectDTO, ['password']), uid, id },
      'PUT /project/:id',
    )

    if (!uid) {
      throw new UnauthorizedException('Please auth first')
    }

    this.projectService.validateProject(projectDTO)
    const project = await this.projectService.findOne(id, {
      relations: ['admin', 'share', 'share.user'],
    })
    const user = await this.userService.findOne(uid)

    if (_isEmpty(project)) {
      throw new NotFoundException()
    }

    this.projectService.allowedToManage(project, uid, user.roles)

    if (projectDTO.public) {
      project.public = Boolean(projectDTO.public)
    }

    if (projectDTO.active) {
      project.active = Boolean(projectDTO.active)
    }

    if (projectDTO.origins) {
      project.origins = _map(projectDTO.origins, _trim)
    }

    if (projectDTO.ipBlacklist) {
      project.ipBlacklist = _map(projectDTO.ipBlacklist, _trim)
    }

    if (projectDTO.name) {
      project.name = _trim(projectDTO.name)
    }

    if (_isBoolean(projectDTO.isPasswordProtected)) {
      if (projectDTO.isPasswordProtected) {
        if (projectDTO.password) {
          project.isPasswordProtected = true
          project.passwordHash = await hash(projectDTO.password, 10)
        }
      } else {
        project.isPasswordProtected = false
        project.passwordHash = null
      }
    }

    await this.projectService.update(id, _omit(project, ['share', 'admin']))

    // await updateProjectRedis(id, project)
    await deleteProjectRedis(id)

    return _omit(project, ['admin', 'passwordHash', 'share'])
  }

  // The routes related to sharing projects feature
  @Delete('/:pid/:shareId')
  @HttpCode(204)
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles(UserType.CUSTOMER, UserType.ADMIN)
  @ApiResponse({ status: 204, description: 'Empty body' })
  async deleteShare(
    @Param('pid') pid: string,
    @Param('shareId') shareId: string,
    @CurrentUserId() uid: string,
  ): Promise<any> {
    this.logger.log({ uid, pid, shareId }, 'DELETE /project/:pid/:shareId')

    if (!isValidPID(pid)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOneWhere(
      { id: pid },
      {
        relations: ['admin'],
        select: ['id', 'admin'],
      },
    )

    if (_isEmpty(project)) {
      throw new NotFoundException(`Project with ID ${pid} does not exist`)
    }

    const user = await this.userService.findOne(uid)

    this.projectService.allowedToManage(project, uid, user.roles)

    await deleteProjectRedis(pid)
    await this.projectService.deleteShare(shareId)
  }

  @Get('/:id')
  @Auth([], true, true)
  @ApiResponse({ status: 200, type: Project })
  async getOne(
    @Param('id') id: string,
    @CurrentUserId() uid: string,
    @Headers() headers: { 'x-password'?: string },
  ): Promise<Project | object> {
    this.logger.log({ id }, 'GET /project/:id')
    if (!isValidPID(id)) {
      throw new BadRequestException(
        'The provided Project ID (pid) is incorrect',
      )
    }

    const project = await this.projectService.findOne(id, {
      relations: ['admin', 'share', 'share.user', 'funnels'],
    })

    if (_isEmpty(project)) {
      throw new NotFoundException('Project was not found in the database')
    }

    if (project.isPasswordProtected && _isEmpty(headers['x-password'])) {
      return {
        isPasswordProtected: true,
        id: project.id,
      }
    }

    this.projectService.allowedToView(project, uid, headers['x-password'])

    return {
      ..._omit(project, ['admin', 'passwordHash', 'share']),
      isOwner: uid === project.admin?.id,
    }
  }
}
