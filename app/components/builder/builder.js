import React, { Component } from 'react'
import WorkArea from '../field/field'

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
            <button onClick={() => setMode(value)} key={name} >{name}</button>
          ))}
        </header>

        {[Object.entries(builderTree)[0]].map(([key, data]) => (
          <WorkArea
            key={key}
            fkey={key}
            data={data}
            mode={textMode}
            modes={modes}
          />
        ))}
      </div>
    )
  }
}
