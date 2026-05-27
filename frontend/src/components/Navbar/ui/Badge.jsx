import React from 'react'

const Badge = ({ 
  label, 
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  }

  return (
    <span className={`badge ${variants[variant]} ${sizes[size]} ${className}`}>
      {label}
    </span>
  )
}

export default Badge