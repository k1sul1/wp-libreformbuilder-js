import React, { Component } from 'react'
import { DropTarget } from 'react-dnd'
import Field from '../field'

// @DropTarget()
export default class Builder extends Component {
  render () {
    const { tree } = this.props

    return (
      <div id="builder">
        {[Object.entries(tree)[0]].map(([key, data]) => (
          <Field key={key} fkey={key} data={data} tree={tree} />
        ))}
      </div>
    )
  }
}
