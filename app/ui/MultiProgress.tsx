import React, { memo } from 'react'
import cx from 'clsx'
import _map from 'lodash/map'

interface IProgress {
  value: number
  lightColour: string
  darkColour: string
}

interface IMultiProgress {
  progress: IProgress[]
  theme: 'dark' | 'light'
  className?: string
}

const MultiProgress = ({ progress, theme, className }: IMultiProgress): JSX.Element => (
  <div className='relative' data-testid='multiprogress'>
    <div className={cx('overflow-hidden h-5 text-xs flex rounded bg-gray-200 dark:bg-slate-600', className)}>
      {_map(progress, ({ value, lightColour, darkColour }) => (
        <div
          key={`${value}-${lightColour}-${darkColour}`}
          style={{
            width: `${value}%`,
            backgroundColor: theme === 'dark' ? darkColour : lightColour,
          }}
          className='shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center'
        />
      ))}
    </div>
  </div>
)

export default memo(MultiProgress)
