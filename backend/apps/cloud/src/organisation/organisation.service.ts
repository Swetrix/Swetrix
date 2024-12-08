import { Injectable, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm'
import { find as _find } from 'lodash'

import { Organisation } from './entity/organisation.entity'
import {
  OrganisationMember,
  OrganisationRole,
} from './entity/organisation-member.entity'
import { Pagination, PaginationOptionsInterface } from '../common/pagination'

@Injectable()
export class OrganisationService {
  constructor(
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    @InjectRepository(OrganisationMember)
    private membershipRepository: Repository<OrganisationMember>,
  ) {}

  async create(data: Partial<Organisation>) {
    const org = this.organisationRepository.create(data)
    return this.organisationRepository.save(org)
  }

  async update(id: string, data: Partial<Organisation>) {
    return this.organisationRepository.update(id, data)
  }

  async findOne(options: FindOneOptions<Organisation>) {
    return this.organisationRepository.findOne(options)
  }

  async find(options: FindManyOptions<Organisation>) {
    return this.organisationRepository.find(options)
  }

  async delete(id: string) {
    return this.organisationRepository.delete(id)
  }

  async deleteMemberships(options: FindOptionsWhere<OrganisationMember>) {
    return this.membershipRepository.delete(options)
  }

  async findMemberships(options: FindManyOptions<OrganisationMember>) {
    return this.membershipRepository.find(options)
  }

  async createMembership(data: Partial<OrganisationMember>) {
    const membership = this.membershipRepository.create(data)
    return this.membershipRepository.save(membership)
  }

  async findOneMembership(options: FindOneOptions<OrganisationMember>) {
    return this.membershipRepository.findOne(options)
  }

  async updateMembership(id: string, data: Partial<OrganisationMember>) {
    await this.membershipRepository.update(id, data)
    return this.findOneMembership({ where: { id } })
  }

  async deleteMembership(id: string) {
    await this.membershipRepository.delete(id)
  }

  validateManageAccess(organisation: Organisation, userId: string) {
    const membership = _find(
      organisation.members,
      member => member.user?.id === userId,
    )

    if (!membership || membership.role === OrganisationRole.viewer) {
      throw new ForbiddenException(
        'You do not have permission to manage this organisation',
      )
    }
  }

  async canManageOrganisation(organisationId: string, userId: string) {
    const organisation = await this.findOne({
      where: { id: organisationId },
      relations: ['members', 'members.user'],
    })

    if (!organisation) {
      return false
    }

    try {
      this.validateManageAccess(organisation, userId)
      return true
    } catch {
      return false
    }
  }

  async isOrganisationOwner(organisationId: string, userId: string) {
    const ownerMembership = await this.findOneMembership({
      where: {
        organisation: { id: organisationId },
        role: OrganisationRole.owner,
        user: { id: userId },
      },
    })

    return !!ownerMembership
  }

  async getOrganisationOwner(organisationId: string) {
    const ownerMembership = await this.findOneMembership({
      where: {
        organisation: { id: organisationId },
        role: OrganisationRole.owner,
      },
      relations: ['user'],
    })

    if (!ownerMembership) {
      throw new ForbiddenException('Organisation owner not found')
    }

    return ownerMembership.user
  }

  async paginate(
    options: PaginationOptionsInterface,
    where?: FindOptionsWhere<Organisation> | FindOptionsWhere<Organisation>[],
  ) {
    const [results, total] = await this.organisationRepository.findAndCount({
      take: options.take || 100,
      skip: options.skip || 0,
      where,
      order: {
        name: 'ASC',
      },
      relations: ['members', 'members.user'],
      select: {
        id: true,
        name: true,
        members: {
          id: true,
          role: true,
          confirmed: true,
          created: true,
          user: {
            id: true,
            email: true,
          },
        },
      },
    })

    return new Pagination<Organisation>({
      results,
      total,
    })
  }
}
