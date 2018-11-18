import './Preview.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'kea'
import shortid from 'shortid'
import builderLogic from '../../logic/app-logic'
import HTML from '../HTML/HTML'
import { getFieldAttributeMeta } from '../../utils/field-attribute-meta'

const renderTree = (tree) => {
  const nodeGenerator = (params) => {
    console.log('nodegen', params)
    const { tag: Tag, attributes = {}, children, key, template, label } = params
    const { wplfbattributes: rawAttrData, ...attrs } = attributes

    // console.log('pls', { Tag, attributes, children, key, template, label })
    let attrData =  {} 

    if (rawAttrData) {
      try {
        attrData = JSON.parse(rawAttrData)

      } catch (e) {
        console.log('Unable to parse attribute data', e)
      }
    }

    Object.entries(attrs).forEach(([attrName, attrValue]) => {
      const meta = getFieldAttributeMeta(attrName, attrData)

      if (meta.type === 'checkbox') {
        if (attrValue === '1') {
          attrs[attrName] = 'true'
          // This may not work on some attributes, like on required
          // Said some attributes print like this: required=""
          // That triggers form validation so thisisfine.jpg
        } else {
          attrs[attrName] = null
        }
      }
    })

    const id = attributes.id || shortid.generate()
    let element = children ? (
      <Tag id={id} {...attrs} key={`${key}-tag`}>
        {children.map((x, i) => {
          // x may be a string key or an object
          const isComponent = typeof x === 'string'

          if (isComponent) {
            return nodeGenerator({ ...tree[x], key: x })
          }

          const { type = 'component', tag, props } = x
          if (type === 'html') {
            if (tag !== 'textNode') {
              const Tag = tag
              
              return <Tag {...props} key={`c-${tag}-${i}`}/>
            }

            return typeof props.children === 'string' 
              ? props.children
              : props.children.join('')
          } else {
            console.log('what the fuck is happening', x)
          }

          return null
        })}
      </Tag>
    ) : (
      <Tag id={id} {...attrs} key={`${key}-tag`} />
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

  const rootNodes = tree.Root.children
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

        <h3>Form preview</h3>

        <div className="wplfb-preview-render" ref={n => { this.result = n }}>
          {renderTree(builderTree)}
        </div>

        <h3>HTML preview</h3>

        <textarea className="wplfb-preview-html" value={previewHTML} readOnly />
      </div>
    )
  }
}
