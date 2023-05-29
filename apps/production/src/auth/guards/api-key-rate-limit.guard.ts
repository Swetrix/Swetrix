import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { checkRateLimitForApiKey } from 'src/common/utils'
import { ACCOUNT_PLANS, PlanCode } from 'src/user/entities/user.entity'

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const { user } = request

    if (request.headers['x-api-key']) {
      if (!user) return false

      const reqAmount =
        ACCOUNT_PLANS[user.planCode as PlanCode].maxApiKeyRequestsPerHour
      return checkRateLimitForApiKey(user.apiKey, reqAmount)
    }

    return true
  }
}
