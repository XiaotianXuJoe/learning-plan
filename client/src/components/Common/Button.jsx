import React from 'react'

/**
 * 通用按钮组件
 * 支持多种变体：primary, secondary, outline, ghost, danger
 * 支持多种尺寸：sm, md, lg
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  // 变体样式映射
  const variantStyles = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:bg-emerald-700',
    secondary: 'bg-gray-800 hover:bg-gray-900 text-white shadow-sm active:bg-gray-950',
    outline: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm active:bg-red-700',
    white: 'bg-white hover:bg-gray-50 text-gray-800 shadow-sm border border-gray-200 active:bg-gray-100',
  }

  // 尺寸样式映射
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  }

  // 禁用和加载状态
  const stateStyles = (disabled || loading)
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer'

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${stateStyles}
        ${widthStyle}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
