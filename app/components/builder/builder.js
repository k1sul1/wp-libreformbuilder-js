import React, { Component } from 'react'
import { DropTarget } from 'react-dnd'
import Field from '../field/field'

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
    const { tree, connectDropTarget, actions } = this.props

    return connectDropTarget(
      <div id="builder">
        {[Object.entries(tree)[0]].map(([key, data]) => (
          <Field key={key} fkey={key} data={data} tree={tree} origin={'Builder'} actions={actions} />
        ))}
      </div>
    )
  }
}
