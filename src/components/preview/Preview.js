import './Preview.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'kea'
import shortid from 'shortid'
import builderLogic from '../../logic/app-logic'
import HTML from '../HTML/HTML'

const renderTree = (tree) => {
  const nodeGenerator = ({ tag: Tag, attributes, children, key, template, label }) => {
    const id = attributes.id || shortid.generate()
    const textContent = attributes['data-text']
    let element = children ? (
      <Tag id={id} {...attributes} key={`${key}-tag`}>
        {textContent}
        {children.map(key => nodeGenerator({ ...tree[key], key }))}
      </Tag>
    ) : (
      <Tag id={id} {...attributes} key={`${key}-tag`} />
    )

    if (label) {
      element = ( // eslint-disable-next-line jsx-a11y/label-has-for
        <label key={`${key}-label`} htmlFor={id}>
          <span className="wplfb-label">{label}</span>
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
  static propTypes = {
    builderTree: PropTypes.object.isRequired,
    previewHTML: PropTypes.string,
  }

  componentDidMount () {
    this.actions.setHTML(this.result.querySelector('form').innerHTML)
  }

  render () {
    const { builderTree, previewHTML } = this.props

    return (
      <div className="wplfb-preview">
        <p>Please note that this preview is subject to admin area styles,
          and the frontend probably looks different.</p>

        <h2>Form preview</h2>

        <div className="wplfb-preview-render" ref={n => { this.result = n }}>
          {renderTree(builderTree)}
        </div>

        <h2>HTML preview</h2>

        <textarea className="wplfb-preview-html" value={previewHTML} />
      </div>
    )
  }
}
