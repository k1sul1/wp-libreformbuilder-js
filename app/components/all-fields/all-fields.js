import React, { Component } from 'react'
import Field from '../field/field'

export default class AllFields extends Component {
  render () {
    const { fields, actions } = this.props

    return (
      <div id="fields">
        {Object.entries(fields).map(([key, data]) => (
          <Field key={key} fkey={key} data={data} origin={'AllFields'} actions={actions} />
        ))}
      </div>
    )
  }
}
