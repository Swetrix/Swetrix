import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { StateType } from '~/lib/store'
import { getAccessToken } from '~/utils/accessToken'
import routes from '~/utils/routes'

interface AuthParamType {
  shouldBeAuthenticated: boolean
  redirectPath: string
}

type PropsType = Record<string, any>

export const auth = {
  authenticated: {
    shouldBeAuthenticated: true,
    redirectPath: routes.signin,
  },
  notAuthenticated: {
    shouldBeAuthenticated: false,
    redirectPath: routes.dashboard,
  },
}

export const withAuthentication = <P extends PropsType>(WrappedComponent: any, authParam: AuthParamType) => {
  const accessToken = getAccessToken()

  const WithAuthentication = (props: P) => {
    const { shouldBeAuthenticated, redirectPath } = authParam
    const { authenticated: reduxAuthenticated, loading } = useSelector((state: StateType) => state.auth)
    const navigate = useNavigate()
    const authenticated = loading ? !!accessToken : reduxAuthenticated

    // We need to use ref to avoid 404 errors - https://github.com/remix-run/react-router/pull/12853
    const navigating = useRef(false)

    useEffect(() => {
      if (navigating.current) {
        return
      }

      if (shouldBeAuthenticated !== authenticated) {
        navigate(redirectPath)
        navigating.current = true
      }
      // TODO: Investigate this later. https://github.com/remix-run/react-router/discussions/8465
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, shouldBeAuthenticated])

    // if (!selector) {
    //   return null
    // }

    return <WrappedComponent {...props} />
  }

  return WithAuthentication
}
