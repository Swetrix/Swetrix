import { call, put } from 'redux-saga/effects'

import { authActions } from 'redux/reducers/auth'
const { verifyEmail } = require('api')

export default function* verifyEmailWorker({
  payload: { data, successfulCallback, errorCallback },
}: {
  payload: {
    data: {
      id: string
    }
    successfulCallback: () => void
    errorCallback: (error: any) => void
  }
}) {
  try {
    // @ts-ignore
    yield call(verifyEmail, data)
    yield put(authActions.mergeUser({ isActive: true }))
    successfulCallback()
  } catch (reason) {
    errorCallback(reason)
  } finally {
    yield put(authActions.finishLoading())
  }
}
