import React from 'react'

import './Button.scss'

export default ({ children, className, element: Element = 'button', ...props }) => (
  <Element className={`wplfb-button ${className || ''}`} {...props}>
    {children}
  </Element>
)
