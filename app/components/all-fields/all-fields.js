import React, { Component } from 'react'
import Field from '../field/field'

import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'

@connect({
  // actions: [
    // builderLogic, [
      // 'addField',
      // 'moveField',
      // 'deleteField',
    // ]
  // ],
  props: [
    builderLogic, [
      'fields',
      'builderTree',
      'populatedField'
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
