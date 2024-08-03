import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsLocale,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isISO31661Alpha2,
  IsUrl,
} from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'
import { ProjectViewType } from '../entity/project-view.entity'
import { ProjectViewCustomEventMetaValueType } from '../entity/project-view-custom-event.entity'

// This can be updated by the customer request.
// In case we find out that ``cc`` may have any other values, just extend the ``allowedValues`` defined below
// Current implementation is for ``Cloudflare``

const allowedValues = ['T1', 'XX']

@ValidatorConstraint({ async: false })
export class IsISO31661Alpha2OrCustomConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any) {
    return isISO31661Alpha2(value) || allowedValues.includes(value)
  }

  defaultMessage() {
    return `cc must be a valid ISO 3166-1 alpha-2 country code or one of the following: ${allowedValues}`
  }
}

export function IsISO31661Alpha2OrCustom(
  validationOptions?: ValidationOptions,
) {
  return function closure(object: object, propertyName: string) {
    // changed from Object to object
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsISO31661Alpha2OrCustomConstraint,
    })
  }
}

export class ProjectViewCustomEventDto {
  @ApiProperty()
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  customEventName: string

  @ApiProperty()
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  metaKey: string

  @ApiProperty()
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  metaValue: string

  @ApiProperty({ enum: ProjectViewCustomEventMetaValueType })
  @IsEnum(ProjectViewCustomEventMetaValueType)
  @IsNotEmpty()
  metaValueType: ProjectViewCustomEventMetaValueType
}

export class CreateProjectViewDto {
  @ApiProperty()
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Type of the view', enum: ProjectViewType })
  @IsEnum(ProjectViewType)
  @IsNotEmpty()
  type: ProjectViewType

  @ApiProperty({ description: 'Page the user viewed (/hello)', nullable: true })
  /* eslint-disable-next-line */
  @Matches(/^\/[a-zA-Z0-9-_\/\[\]]*$/, {
    message: 'Invalid URL path format for pg',
  })
  @IsOptional()
  pg?: string

  @ApiProperty({ description: 'Name of the custom event (e.g., sign_up)' })
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsOptional()
  ev?: string

  @ApiProperty({
    description: 'User device (mobile, desktop, tablet, etc.)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  dv?: string

  @ApiProperty({ description: 'Browser', nullable: true })
  @IsString()
  @IsOptional()
  br?: string

  @ApiProperty({ description: 'Operating system', nullable: true })
  @IsString()
  @IsOptional()
  os?: string

  @ApiProperty({ description: 'Locale (en-UK, en-US)', nullable: true })
  @IsLocale()
  @IsOptional()
  lc?: string

  @ApiProperty({
    description:
      'Referrer (site from which the user came to the site using Swetrix)',
    nullable: true,
  })
  @IsUrl()
  @IsOptional()
  ref?: string

  @ApiProperty({ description: 'UTM source', nullable: true })
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsOptional()
  so?: string

  @ApiProperty({ description: 'UTM medium', nullable: true })
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsOptional()
  me?: string

  @ApiProperty({ description: 'UTM campaign', nullable: true })
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  @IsOptional()
  ca?: string

  @ApiProperty({ description: 'Country code', nullable: true })
  @IsISO31661Alpha2OrCustom()
  @IsNotEmpty()
  cc: string

  @ApiProperty({ description: 'Region/state (Alabama, etc.)', nullable: true })
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  rg?: string

  @ApiProperty({ description: 'City (Berlin, London, etc.)', nullable: true })
  @MaxLength(100)
  @MinLength(1)
  @IsString()
  ct?: string

  @ApiProperty({ type: ProjectViewCustomEventDto, isArray: true })
  @ValidateNested()
  @IsNotEmpty()
  customEvents: ProjectViewCustomEventDto[]
}
