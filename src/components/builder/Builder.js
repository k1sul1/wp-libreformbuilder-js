import React, { Component } from 'react'
import PropTypes from 'prop-types'
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
    ]
  ]
})
export default class Builder extends Component {
  static propTypes = {
    builderTree: PropTypes.object.isRequired,
    modes: PropTypes.object.isRequired,
    mode: PropTypes.object.isRequired,
  }
  render () {
    const { setMode } = this.actions
    const { builderTree, modes, mode } = this.props

    // Submodes don't count at this level
    const activeMode = mode.submode
      ? Object.values(modes).find(m => m.id === mode.submode)
      : mode

    return (
      <div id="builder" className="wplfb">
        <header className={`builder-header mode-${activeMode.name}`}>
          <span className={`builder-header__mode`}>
            {mode.name}
          </span>

          <div className="builder-header__buttons wplfb-button-group">
            {Object.entries(modes)
              .filter(([, mode]) => !mode.submode)
              .map(([, mode]) => (
                <Button
                  onClick={() => setMode(mode)}
                  className={mode.name === activeMode.name ? 'active bg-blue' : ''}
                  key={mode.id}
                >
                  {mode.name}
                </Button>
              ))}
          </div>
        </header>

        {(activeMode === modes.insert || activeMode === modes.move) && (
          <WorkArea
            mode={mode}
            modes={modes}
          />
        )}

        {activeMode === modes.preview && (
          <Preview tree={builderTree} />
        )}
      </div>
    )
  }
}
