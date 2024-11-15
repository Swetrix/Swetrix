import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsNotEmpty, IsString } from 'class-validator'

export const DEFAULT_THEME = 'light'

export class GenerateDto {
  @ApiProperty({
    example: 'aUn1quEid-3',
    required: true,
    description: 'A unique project ID',
  })
  @IsNotEmpty()
  @IsString()
  pid: string

  @ApiProperty({
    default: DEFAULT_THEME,
    required: false,
    description: 'Captcha theme',
  })
  @IsOptional()
  theme?: string
}
