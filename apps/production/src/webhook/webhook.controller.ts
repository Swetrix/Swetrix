import {
  Controller,
  Body,
  Post,
  Headers,
  BadRequestException,
  NotFoundException,
  HttpCode,
  Ip,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import * as _find from 'lodash/find'

import { ProjectService } from '../project/project.service'
import { getIPFromHeaders } from '../common/utils'
import {
  PlanCode,
  ACCOUNT_PLANS,
  BillingFrequency,
} from '../user/entities/user.entity'
import { UserService } from '../user/user.service'
import { AppLoggerService } from '../logger/logger.service'
import { WebhookService } from './webhook.service'

const MAX_PAYMENT_ATTEMPTS = 5

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly userService: UserService,
    private readonly webhookService: WebhookService,
    private readonly projectService: ProjectService,
  ) {}

  @Post('/paddle')
  @HttpCode(200)
  async paddleWebhook(
    @Body() body,
    @Headers() headers,
    @Ip() reqIP,
  ): Promise<any> {
    const ip = getIPFromHeaders(headers) || reqIP || ''

    this.webhookService.verifyIP(ip)
    this.webhookService.validateWebhook(body)

    switch (body.alert_name) {
      case 'subscription_created':
      case 'subscription_updated': {
        const {
          passthrough,
          email,
          subscription_id: subID,
          subscription_plan_id: subscriptionPlanId,
          cancel_url: subCancelURL,
          update_url: subUpdateURL,
          next_bill_date: nextBillDate,
          currency,
        } = body
        let uid

        try {
          uid = JSON.parse(passthrough)?.uid
        } catch {
          this.logger.error(
            `[${body.alert_name}] Cannot parse the uid: ${JSON.stringify(
              body,
            )}`,
          )
        }

        let monthlyBilling = true
        let plan = _find(ACCOUNT_PLANS, ({ pid }) => pid === subscriptionPlanId)

        if (!plan) {
          monthlyBilling = false
          plan = _find(ACCOUNT_PLANS, ({ ypid }) => ypid === subscriptionPlanId)
        }

        if (!plan) {
          throw new NotFoundException(
            `The selected account plan (${subscriptionPlanId}) is not available`,
          )
        }

        const updateParams = {
          planCode: plan.id,
          subID,
          subUpdateURL,
          subCancelURL,
          nextBillDate,
          billingFrequency: monthlyBilling
            ? BillingFrequency.Monthly
            : BillingFrequency.Yearly,
          tierCurrency: currency,
        }

        if (uid) {
          await this.userService.update(uid, updateParams)
          await this.projectService.clearProjectsRedisCache(uid)
        } else {
          await this.userService.updateByEmail(email, updateParams)
          await this.projectService.clearProjectsRedisCacheByEmail(email)
        }

        break
      }

      case 'subscription_cancelled': {
        const {
          subscription_id: subID,
          cancellation_effective_date: cancellationEffectiveDate,
        } = body

        await this.userService.updateBySubID(subID, {
          billingFrequency: BillingFrequency.Monthly,
          nextBillDate: null,
          cancellationEffectiveDate,
          tierCurrency: null,
        })

        break
      }

      // case 'subscription_payment_refunded': {
      //   const { subscription_id: subID } = body

      //   await this.userService.updateBySubID(subID, {
      //     planCode: PlanCode.none,
      //     billingFrequency: BillingFrequency.Monthly,
      //     nextBillDate: null,
      //     tierCurrency: null,
      //   })

      //   break
      // }

      case 'subscription_payment_succeeded': {
        const {
          subscription_id: subID,
          balance_earnings: balanceEarnings,
          balance_currency: balanceCurrency,
        } = body

        const subscriber = await this.userService.findOneWhere({ subID })

        if (!subscriber) {
          this.logger.error(
            `[subscription_payment_succeeded] Cannot find the subscriber with subID: ${subID}\nBody: ${JSON.stringify(
              body,
              null,
              2,
            )}`,
          )
          return
        }

        // That user was not referred by anyone
        if (!subscriber.referrerID) {
          return
        }

        const referrer = await this.userService.findOneWhere({
          id: subscriber.referrerID,
        })

        if (!referrer) {
          this.logger.error(
            `[subscription_payment_succeeded] Cannot find the referrer with ID: ${subscriber.referrerID}`,
          )
          return
        }

        await this.webhookService.setReferralPayoutsToProcessing(
          subscriber.id,
          referrer,
        )

        await this.webhookService.addPayoutForUser(
          referrer,
          subscriber.id,
          Number(balanceEarnings),
          balanceCurrency,
        )

        break
      }

      case 'subscription_payment_failed': {
        const { subscription_id: subID, attempt_number: attemptNumber } = body

        if (parseInt(attemptNumber, 10) >= MAX_PAYMENT_ATTEMPTS) {
          await this.userService.updateBySubID(subID, {
            planCode: PlanCode.none,
            billingFrequency: BillingFrequency.Monthly,
            nextBillDate: null,
            tierCurrency: null,
          })
        }

        break
      }

      default:
        throw new BadRequestException('Unexpected event type')
    }
  }
}
