import React, { Component } from 'react'
import { DropTarget } from 'react-dnd'
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
@DropTarget(['field'], {
  hover (props, monitor, component) {
    console.log('hover builder', props)
  },

  drop (props, monitor, component) {
    if (monitor.didDrop()) {
      // some field must've received the drop
      return
    }

    const item = monitor.getItem()
    console.log(item)
    return { moved: item, target: 'builder' }
  },
}, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  isOverCurrent: monitor.isOver({ shallow: true }),
  canDrop: monitor.canDrop(),
  itemType: monitor.getItemType()
}))
export default class Builder extends Component {
  render () {
    const { connectDropTarget, actions, builderTree } = this.props

    return connectDropTarget(
      <div id="builder">
        {[Object.entries(builderTree)[0]].map(([key, data]) => (
          <Field
            key={key}
            fkey={key}
            data={data}
            origin={'Builder'}
            actions={actions} />
        ))}
      </div>
    )
  }
}
