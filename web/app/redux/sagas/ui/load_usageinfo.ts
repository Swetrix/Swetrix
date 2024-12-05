import { put, call, select } from 'redux-saga/effects'

import UIActions from 'redux/reducers/ui'
import { isSelfhosted } from 'redux/constants'
import { IUsageInfo } from 'redux/models/IUsageinfo'
const { getUsageInfo } = require('api')

export default function* loadUsageinfo() {
  if (isSelfhosted) {
    return
  }

  const isUsageinfoLoaded: boolean = yield select((state) => state.ui.misc.usageinfoLoaded)

  if (isUsageinfoLoaded) {
    return
  }

  try {
    const info: IUsageInfo = yield call(getUsageInfo)

    yield put(UIActions.setUsageinfo(info))
  } catch (reason: unknown) {
    const { message } = reason as { message: string }
    // if (_isString(message)) {
    //   yield put(UIActions.setProjectsError(message))
    // }
    console.error('failed to load usageinfo:', message)
  }
}
