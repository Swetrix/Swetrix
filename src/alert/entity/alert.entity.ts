import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

import { Project } from 'src/project/entity/project.entity'
import {
  QueryCondition, QueryMetric, QueryTime, AlertType,
} from 'src/alert/dto/alert.dto'

@Entity()
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Project, project => project.alerts)
  project: Project

  @ApiProperty()
  @Column('varchar', { length: 50 })
  name: string

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: AlertType,
    default: AlertType.TRAFFIC,
  })
  type: AlertType

  @ApiProperty()
  @Column({
    default: true,
  })
  active: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: Date

  @ApiProperty()
  @Column({
    type: 'date',
    nullable: true,
    default: null,
  })
  lastTriggered: Date | null

  // traffic type related fields
  @ApiProperty()
  @Column({
    type: 'enum',
    enum: QueryMetric,
    nullable: true,
    default: null,
  })
  queryMetric: QueryMetric | null

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: QueryCondition,
    nullable: true,
    default: null,
  })
  queryCondition: QueryCondition | null

  @ApiProperty()
  @Column({
    type: 'int',
    nullable: true,
    default: null,
  })
  queryValue: number | null

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: QueryTime,
    nullable: true,
    default: null,
  })
  queryTime: QueryTime | null

  // custom event type related fields
  @ApiProperty()
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  customEvent: string | null
}
