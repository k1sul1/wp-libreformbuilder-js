import React from 'react'

import './Button.scss'

export default ({ children, className, onClick, element: Element = 'button', ...props }) => (
  <Element
    className={`wplfb-button ${className || ''}`}
    onClick={(e) => {
      if (onClick) {
        onClick(e)
      }

      e.preventDefault()
    }}
    {...props}
  >
    {children}
  </Element>
)
