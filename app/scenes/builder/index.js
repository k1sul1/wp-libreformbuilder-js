import './styles.scss'

import React, { Component } from 'react'
import { connect } from 'kea'
import builderLogic from './logic'

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
export default class BuilderScene extends Component {
  constructor () {
    super()

    this.renderField = this.renderField.bind(this)
  }

  renderField ([key, data]) {
    const { builderTree } = this.props
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
          {children.map(id => [id, builderTree[id]]).map(this.renderField)}
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

  componentDidMount () {
    setTimeout(() => {
      this.actions.moveField('test1', 'builder', 0)
      this.actions.addField('builder', 1, this.props.populatedField('text', {
        attributes: {
          placeholder: 'Kissa'
        },
      }))
    }, 2000)
    setTimeout(() => {
      this.actions.moveField('test1', 'builder', 1)
    }, 4000)
  }

  render () {
    const { fields, builderTree } = this.props

    return (
      <main>
        <div id="builder">
          {[Object.entries(builderTree)[0]].map(this.renderField)}
        </div>

        <div id="fields">
          {Object.entries(fields).map(this.renderField)}
        </div>
      </main>
    )
  }
}
