import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

/*
 * See https://fontawesome.com/how-to-use/on-the-web/styling/ for help.
 */
export default class Icon extends Component {
  static propTypes = {
    srtext: PropTypes.string,
    text: PropTypes.string,
    icon: PropTypes.string.isRequired,
    fixedWidth: PropTypes.bool,
    animation: PropTypes.string,
    list: PropTypes.bool,
  }

  render () {
    const { srtext, text, icon, fixedWidth, animation, list } = this.props
    const className = ['wplfb-icon fas']

    className.push(`fa-${icon}`)

    if (fixedWidth) {
      className.push('fa-fw')
    }

    if (animation) {
      className.push(`fa-${animation}`)
    }

    let element = (
      <i
        className={className.join(' ')}
        aria-hidden
      />
    )

    if (srtext || text) {
      if (srtext) {
        element = (
          <Fragment>
            {element}
            <span className="screen-reader-text">{srtext}</span>
          </Fragment>
        )
      }

      if (text) {
        element = (
          <Fragment>
            {element}
            <span className="icon-text">{text}</span>
          </Fragment>
        )
      }
    }

    if (list) {
      element = (
        <li><span className="fa-li">{element}</span></li>
      )
    }

    return element
  }
}
