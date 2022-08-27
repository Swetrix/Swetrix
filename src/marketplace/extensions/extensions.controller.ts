import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Like } from 'typeorm'
import { AddExtension } from './dtos/add-extension.dto'
import { RemoveExtensionParams } from './dtos/remove-extension-params.dto'
import { GetExtensionParams } from './dtos/get-extension-params.dto'
import { GetAllExtensionsQueries } from './dtos/get-all-extensions-queries.dto'
import { Extension } from './extension.entity'
import { ExtensionsService } from './extensions.service'
import { ISaveExtension } from './interfaces/save-extension.interface'
import { UpdateExtensionParams } from './dtos/update-extension-params.dto'
import { UpdateExtension } from './dtos/update-extension.dto'
import { BodyValidationPipe } from '../common/pipes/body-validation.pipe'
import { SearchExtensionQueries } from './dtos/search-extension-queries.dto'

@ApiTags('extensions')
@UsePipes(
  new ValidationPipe({
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    whitelist: true,
  }),
)
@Controller('extensions')
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService) {}

  @ApiQuery({
    description: 'Extension offset',
    example: '5',
    name: 'offset',
    required: false,
    type: String,
  })
  @ApiQuery({
    description: 'Extension limit',
    example: '25',
    name: 'limit',
    required: false,
    type: String,
  })
  @Get()
  async getAllExtensions(@Query() queries: GetAllExtensionsQueries): Promise<{
    extensions: Extension[]
    count: number
  }> {
    const [extensions, count] = await this.extensionsService.findAndCount({
      skip: queries.offset || 0,
      take: queries.limit > 100 ? 25 : queries.limit || 25,
    })

    return { extensions, count }
  }

  @ApiQuery({
    description: 'Extension title',
    example: '',
    name: 'title',
    type: String,
  })
  @ApiQuery({
    description: 'Extension offset',
    example: '5',
    name: 'offset',
    required: false,
    type: String,
  })
  @ApiQuery({
    description: 'Extension limit',
    example: '25',
    name: 'limit',
    required: false,
    type: String,
  })
  @Get('search')
  async searchExtension(@Query() queries: SearchExtensionQueries): Promise<{
    extensions: Extension[]
    count: number
  }> {
    const [extensions, count] = await this.extensionsService.findAndCount({
      where: {
        title: Like(`%${queries.title}%`),
      },
      skip: queries.offset || 0,
      take: queries.limit > 100 ? 25 : queries.limit || 25,
    })

    return { extensions, count }
  }

  @ApiParam({
    name: 'extensionId',
    description: 'Extension ID',
    example: '1',
    type: String,
  })
  @Get(':extensionId')
  async getExtension(@Param() params: GetExtensionParams): Promise<Extension> {
    const extension = await this.extensionsService.findById(params.extensionId)

    if (!extension) {
      throw new NotFoundException('Extension not found.')
    }

    return extension
  }

  @Post()
  async addExtension(
    @Body() body: AddExtension,
  ): Promise<ISaveExtension & Extension> {
    const title = await this.extensionsService.findTitle(body.title)

    if (title) {
      throw new ConflictException('The extension already exists.')
    }

    const extensionInstance = this.extensionsService.create(body)

    return await this.extensionsService.save(extensionInstance)
  }

  @ApiParam({
    name: 'extensionId',
    description: 'Extension ID',
    example: '1',
    type: String,
  })
  @Patch(':extensionId')
  async updateExtension(
    @Param() params: UpdateExtensionParams,
    @Body(new BodyValidationPipe()) body: UpdateExtension,
  ): Promise<UpdateExtension> {
    const extension = await this.extensionsService.findById(params.extensionId)

    if (!extension) {
      throw new NotFoundException('Extension not found.')
    }

    await this.extensionsService.update(extension.id, body)

    return body
  }

  @ApiParam({
    name: 'extensionId',
    description: 'Extension ID',
    example: '1',
    type: String,
  })
  @Delete(':extensionId')
  async removeExtension(@Param() params: RemoveExtensionParams): Promise<void> {
    const extension = await this.extensionsService.findById(params.extensionId)

    if (!extension) {
      throw new NotFoundException('Extension not found.')
    }

    await this.extensionsService.delete(extension.id)
  }
}
