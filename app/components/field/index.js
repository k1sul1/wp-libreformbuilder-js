import React, { Component } from 'react'
import { DragSource, DropTarget } from 'react-dnd'

// @DragSource()
// @DropTarget()
export default class Field extends Component {
  constructor () {
    super()

    this.renderField = this.renderField.bind(this)
  }

  renderField ([key, data]) {
    const { tree } = this.props
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
        <div className="child-container">
          {children.map(id => [id, tree[id]]).map(this.renderField)}
        </div>
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
    const { fkey, data } = this.props

    return this.renderField([fkey, data])
  }
}
