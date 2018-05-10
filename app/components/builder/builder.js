import React, { Component } from 'react'
import Field from '../field/field'

import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'

@connect({
  actions: [
    builderLogic, [
      'addField',
      'moveField',
      'deleteField',
    ]
  ],
  props: [
    builderLogic, [
      'fields',
      'builderTree',
      'populatedField'
    ]
  ]
})
export default class Builder extends Component {
  render () {
    const { builderTree } = this.props

    return (
      <div id="builder">
        {[Object.entries(builderTree)[0]].map(([key, data]) => (
          <Field
            key={key}
            fkey={key}
            data={data}
            origin={'Builder'} />
        ))}
      </div>
    )
  }
}
