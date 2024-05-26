/* eslint-disable react/button-has-type */
import React, { ButtonHTMLAttributes, memo } from 'react'
import cx from 'clsx'
import Spin from './icons/Spin'

// Define the prop types for the component
interface IButton extends React.DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  // (string): The text to be displayed in the button.
  text?: string
  // (node): The content to be displayed in the button.
  children?: JSX.Element | string
  primary?: boolean
  secondary?: boolean
  danger?: boolean
  // (function): The function to be called when the button is clicked.
  onClick?: () => void
  white?: boolean
  small?: boolean
  regular?: boolean
  large?: boolean
  giant?: boolean
  // (string): The type of button to be rendered.
  type?: 'button' | 'submit' | 'reset'
  // (string): Additional CSS classes to be applied to the button.
  className?: string
  // (boolean): Whether the button is in a loading state.
  loading?: boolean
  semiSmall?: boolean
  semiDanger?: boolean
  // (boolean): Whether the button is in a focus state.
  focus?: boolean
  noBorder?: boolean
  // (boolean): Whether the button is disabled.
  disabled?: boolean
}

const Button = ({
  text,
  children,
  primary,
  secondary,
  danger,
  onClick,
  white,
  small,
  regular,
  large,
  giant,
  type = 'button',
  className,
  loading,
  semiSmall,
  semiDanger,
  noBorder,
  focus = true,
  disabled,
  ...props
}: IButton): JSX.Element => (
  <button
    {...props}
    disabled={disabled || loading}
    type={type}
    onClick={onClick}
    className={cx(
      'relative inline-flex select-none items-center border leading-4 font-medium rounded-md',
      {
        'shadow-sm text-gray-50 bg-slate-900 hover:bg-slate-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 border-transparent':
          primary,
        'text-slate-900 bg-slate-300 hover:bg-slate-200 border-transparent': secondary,
        'text-gray-700 bg-white hover:bg-gray-50 border-transparent': white,
        'text-gray-50 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 border-transparent': danger,
        'text-red-500 hover:text-red-600 border-red-600 dark:text-red-300 dark:hover:text-red-400 dark:border-red-500 border-1':
          semiDanger,
        'focus:border-none border-none text-gray-700 dark:text-white focus:ring-0 focus:ring-offset-0': noBorder,
        'px-2.5 py-1.5 text-xs': small,
        'px-2.5 py-1.5 text-sm': semiSmall,
        'px-4 py-2 text-sm': large,
        'px-6 py-3 text-base': giant,
        'px-3 py-2 text-sm': regular,
        'cursor-not-allowed': loading,
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500': focus,
      },
      className,
    )}
  >
    {loading && <Spin alwaysLight />}
    {text || children}
  </button>
)

export default memo(Button)
