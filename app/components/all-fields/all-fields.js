import React, { Component } from 'react'
import Field from '../field/field'

import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'

@connect({
  props: [
    builderLogic, [
      'fields',
      'builderTree',
    ]
  ]
})
export default class AllFields extends Component {
  render () {
    const { fields } = this.props

    return (
      <div id="fields">
        {Object.entries(fields).map(([key, data]) => (
          <Field
            key={key}
            fkey={key}
            data={data}
            origin={'AllFields'} />
        ))}
      </div>
    )
  }
}
