import './styles.scss'

import React, { Component, Fragment } from 'react'
import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'
import HTML from '../HTML/HTML'

const renderTree = (tree) => {
  const nodeGenerator = ({ tag: Tag, attributes, children, key, template, label }) => {
    const textContent = attributes['data-text']
    let element = children ? (
      <Tag {...attributes} key={`${key}-tag`}>
        {textContent}
        {children.map(key => nodeGenerator({ ...tree[key], key }))}
      </Tag>
    ) : (
      <Tag {...attributes} key={`${key}-tag`} />
    )

    if (label) {
      element = (
        <label key={`${key}-label`}>
          <span className="wplf-label">{label}</span>
          {element}
        </label>
      )
    }

    if (template) {
      element = <HTML element={element} key={`${key}-template`}>{template}</HTML>
    }

    return element
  }
  const rootNodes = tree.builder.children
    .map(key => ({ ...tree[key], key }))
    .map(nodeGenerator)

  return (
    <form>
      {rootNodes}
    </form>
  )
}

@connect({
  actions: [
    builderLogic, [
      'setHTML'
    ]
  ],
  props: [
    builderLogic, [
      'builderTree',
      'previewHTML',
    ]
  ]
})
export default class Preview extends Component {
  componentDidMount () {
    this.actions.setHTML(this.result.querySelector('form').innerHTML)
  }

  render () {
    const { builderTree, previewHTML } = this.props

    return (
      <Fragment>
        <div className="preview" ref={n => { this.result = n }}>
          {renderTree(builderTree)}
        </div>

        <textarea className="result-html" value={previewHTML} />
      </Fragment>

    )
  }
}
