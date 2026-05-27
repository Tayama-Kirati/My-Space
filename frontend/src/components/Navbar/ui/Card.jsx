import React from 'react'

const Card = ({ 
  children, 
  className = '', 
  hover = true, 
  onClick = null 
}) => {
  return (
    <div 
      className={`card ${hover ? 'hover:shadow-xl hover:-translate-y-2' : ''} cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card