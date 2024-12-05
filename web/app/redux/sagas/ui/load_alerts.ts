import { put, call } from 'redux-saga/effects'
import { toast } from 'sonner'
import _isString from 'lodash/isString'
import UIActions from 'redux/reducers/ui'
import { DEFAULT_ALERTS_TAKE, isSelfhosted } from 'redux/constants'
const { getAlerts } = require('api')

export default function* loadProjectAlerts({ payload: { take = DEFAULT_ALERTS_TAKE, skip = 0 } }) {
  if (isSelfhosted) {
    yield put(UIActions.setProjectAlertsLoading(false))
    return
  }

  try {
    yield put(UIActions.setProjectAlertsLoading(true))
    const { results, total, page_total: pageTotal } = yield call(getAlerts, take, skip)

    yield put(UIActions.setProjectAlerts(results))
    yield put(
      UIActions.setProjectAlertsTotal({
        total,
        pageTotal,
      }),
    )
  } catch (e: unknown) {
    const { message } = e as { message: string }
    if (_isString(message)) {
      toast.error(message)
    }
    console.error('failed to load extensions:', message)
  } finally {
    yield put(UIActions.setProjectAlertsLoading(false))
  }
}
