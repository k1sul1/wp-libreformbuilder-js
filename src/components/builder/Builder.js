import React, { Component } from 'react'
import WorkArea from '../workarea/WorkArea'
import Preview from '../preview/Preview'
import Button from '../button/Button'

import { connect } from 'kea'
import builderLogic from '../../logic/app-logic'

import './Builder.scss'

@connect({
  actions: [
    builderLogic, [
      'setMode',
    ]
  ],
  props: [
    builderLogic, [
      'builderTree',
      'mode',
      'modes',
      'textMode',
    ]
  ]
})
export default class Builder extends Component {
  render () {
    const { setMode } = this.actions
    const { builderTree, modes, textMode } = this.props

    return (
      <div id="builder">
        <header className={`builder-header mode-${textMode}`}>
          <span className={`builder-header__mode`}>
            {textMode}
          </span>

          <div className="builder-header__buttons wplfb-button-group">
            {Object.entries(modes).map(([name, value]) => (
              <Button
                onClick={(e) => e.preventDefault() || setMode(value)}
                className={name === textMode ? 'active' : ''}
                key={name}
              >
                {name}
              </Button>
            ))}
          </div>
        </header>

        {(modes[textMode] === modes.insert || modes[textMode] === modes.move) && (
          <WorkArea
            mode={textMode}
            modes={modes}
          />
        )}

        {modes[textMode] === modes.preview && (
          <Preview tree={builderTree} />
        )}
      </div>
    )
  }
}
