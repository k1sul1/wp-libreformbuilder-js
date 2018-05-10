import React, { Component } from 'react'
import { DragSource, DropTarget } from 'react-dnd'
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
@DragSource('field', {
  canDrag () {
    return true
  },

  beginDrag (props, monitor, component) {
    const item = { id: props.fkey, origin: props.origin }

    console.log('hello', item, props)

    return item
  },

  endDrag (props, monitor, component) {
    if (!monitor.didDrop()) {
      // nothing handled the drop?
      return
    }

    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()

    if (item.origin === 'AllFields') {
      console.log('just connect field directly to kea')
      // props.actions.addField(dropResult.target, 0,

    }

    console.log(item, dropResult, props)
  },
}, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
@DropTarget(['field'], {

}, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  isOverCurrent: monitor.isOver({ shallow: true }),
  canDrop: monitor.canDrop(),
  itemType: monitor.getItemType()
}))
export default class Field extends Component {
  constructor () {
    super()

    this.renderField = this.renderField.bind(this)
  }

  renderField ([key, data]) {
    const { builderTree, connectDropTarget } = this.props
    const { tag, attributes, children } = data
    const takesChildren = Boolean(children)
    let Tag = tag

    if (key === 'builder') {
      Tag = 'div'
    } else if (!Tag) {
      throw new Error(`Tried to render field ${key}, but no tag was found.`)
    }

    const element = takesChildren ? (
      <Tag {...attributes}>
        {connectDropTarget(<div className="child-container">
          {children.map(id => [id, builderTree[id]]).map(this.renderField)}
        </div>)}
      </Tag>
    ) : (
      <Tag {...attributes} />
    )
    return (
      <article key={key}>
        <header>
          <h4>{key}</h4>
        </header>
        <section>
          {element}
        </section>
      </article>
    )
  }

  render () {
    const { fkey, data, connectDragSource } = this.props

    return connectDragSource(this.renderField([fkey, data]))
  }
}
