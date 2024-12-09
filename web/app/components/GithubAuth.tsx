import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import cx from 'clsx'

import Button from 'ui/Button'
import { StateType, useAppDispatch } from 'redux/store/index'
import GithubDarkSVG from 'ui/icons/GithubDark'
import GithubLightSVG from 'ui/icons/GithubLight'
import { SSO_PROVIDERS, isBrowser } from 'redux/constants'
import sagaActions from 'redux/sagas/actions'

interface IGoogleAuth {
  setIsLoading: (isLoading: boolean) => void
  ssrTheme: string
  callback?: any
  dontRemember?: boolean
  isMiniButton?: boolean
  className?: string
}

const GithubAuth: React.FC<IGoogleAuth> = ({
  setIsLoading,
  dontRemember,
  callback = () => {},
  isMiniButton,
  className,
  ssrTheme,
}) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const reduxTheme = useSelector((state: StateType) => state.ui.theme.theme)
  const theme = isBrowser ? reduxTheme : ssrTheme

  const googleLogin = async () => {
    setIsLoading(true)
    dispatch(sagaActions.authSSO(SSO_PROVIDERS.GITHUB, Boolean(dontRemember), t, callback))
  }

  if (isMiniButton) {
    return (
      <Button
        title={t('auth.common.continueWithGithub')}
        className={cx(
          className,
          'bg-transparent ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800/60',
        )}
        onClick={googleLogin}
        secondary
        regular
      >
        {theme === 'dark' ? <GithubLightSVG className='h-5 w-5' /> : <GithubDarkSVG className='h-5 w-5' />}
      </Button>
    )
  }

  return (
    <Button
      className={cx(
        className,
        'flex items-center justify-center border-indigo-100 dark:border-slate-700/50 dark:bg-slate-800 dark:text-gray-50 dark:hover:bg-slate-700',
      )}
      onClick={googleLogin}
      secondary
      regular
    >
      <>
        {theme === 'dark' ? <GithubLightSVG className='mr-2 h-5 w-5' /> : <GithubDarkSVG className='mr-2 h-5 w-5' />}
        {t('auth.common.github')}
      </>
    </Button>
  )
}

export default GithubAuth
