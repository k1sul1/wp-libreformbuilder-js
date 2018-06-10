import './styles.scss'

import React, { Component, Fragment } from 'react'
import HTML from '../HTML/HTML'

const renderTree = (tree) => {
  const nodeGenerator = ({ tag: Tag, attributes, children, key, template }) => {
    let element = children ? (
      <Tag {...attributes} key={key}>
        {children.map(key => nodeGenerator({ ...tree[key], key }))}
      </Tag>
    ) : (
      <Tag {...attributes} key={key} />
    )

    if (template) {
      element = <HTML element={element}>{template}</HTML>
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
export default class Preview extends Component {
  state = {
    html: '',
  }

  componentDidMount () {
    this.setState({ html: this.result.querySelector('form').innerHTML })
  }

  // componentWillReceiveProps () {
    // this.setState({ html: this.result.querySelector('form').innerHTML })
  // }

  render () {
    const { tree } = this.props

    return (
      <Fragment>
        <div className="preview" ref={n => { this.result = n }}>
          {renderTree(tree)}
        </div>

        <textarea className="result-html" value={this.state.html} />
      </Fragment>

    )
  }
}
