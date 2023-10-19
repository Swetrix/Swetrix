import { ApiProperty } from '@nestjs/swagger'
import {
  IsNotEmpty,
  Length,
  ArrayMinSize,
  ArrayMaxSize,
  IsUUID,
} from 'class-validator'
import {
  MAX_PAGES_IN_FUNNEL,
  MIN_PAGES_IN_FUNNEL,
} from '../../common/constants'

export class FunnelUpdateDTO {
  @IsUUID('4')
  id: string

  @ApiProperty({
    example: 'User sign up funnel',
    required: true,
    description: 'A display name for your funnel',
  })
  @IsNotEmpty()
  @Length(1, 50)
  name: string

  @ApiProperty({
    example: ['/', '/signup', '/dashboard'],
    required: true,
    description: 'Steps of the funnel',
  })
  @ArrayMinSize(MIN_PAGES_IN_FUNNEL, {
    message: `A funnel must have at least ${MIN_PAGES_IN_FUNNEL} steps`,
  })
  @ArrayMaxSize(MAX_PAGES_IN_FUNNEL, {
    message: `A funnel must have no more than ${MAX_PAGES_IN_FUNNEL} steps`,
  })
  steps: string[] | null
}
