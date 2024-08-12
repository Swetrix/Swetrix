import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional } from 'class-validator'
import { DEFAULT_TIMEZONE } from '../../user/entities/user.entity'

export enum TimeBucketType {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
}

export enum ChartRenderMode {
  PERIODICAL = 'periodical',
  CUMULATIVE = 'cumulative',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class AnalyticsGET_DTO {
  @ApiProperty()
  @IsNotEmpty()
  pid: string

  @ApiProperty()
  period: string

  @ApiProperty({ enum: TimeBucketType })
  @IsNotEmpty()
  timeBucket: TimeBucketType

  @ApiProperty({ required: false })
  from: string

  @ApiProperty({ required: false })
  to: string

  @ApiProperty({
    description:
      'A stringified array of properties to filter [{ column, filter, isExclusive }]',
    required: false,
  })
  filters: string

  @ApiProperty({
    description: 'Timezone to display data in',
    default: DEFAULT_TIMEZONE,
  })
  timezone: string

  @ApiProperty({
    description:
      'Mode in which data in chart should be rendered, may be either periodical or cumulative',
    default: ChartRenderMode.PERIODICAL,
  })
  mode?: ChartRenderMode

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  metrics?: string
}
