import React, { Component } from 'react'
import Field from '../field'

export default class AllFields extends Component {
  render () {
    const { fields } = this.props

    return (
      <div id="fields">
        {Object.entries(fields).map(([key, data]) => (
          <Field key={key} fkey={key} data={data} />
        ))}
      </div>
    )
  }
}
