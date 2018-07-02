import React, { Component } from 'react'
// import WorkArea from '../field/field'
import WorkArea from '../work-area/work-area'
import Preview from '../preview/preview'

import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'

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
        <header className="builder-header">
          <span className="builder-header__mode">
            <strong>MODE</strong>
            {textMode}
          </span>

          {Object.entries(modes).map(([name, value]) => (
            <button onClick={(e) => e.preventDefault() || setMode(value)} key={name} >{name}</button>
          ))}
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
