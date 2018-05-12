import './styles.scss'

import React, { Component } from 'react'

const renderTree = (tree) => {
  const nodeGenerator = ({ tag: Tag, attributes, children, key }) => children ? (
    <Tag {...attributes} key={key}>
      {children.map(key => nodeGenerator({ ...tree[key], key }))}
    </Tag>
  ) : (
    <Tag {...attributes} key={key} />
  )
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
  render () {
    const { tree } = this.props

    return (
      <pre>
        {JSON.stringify(tree, null, 2)}
        {renderTree(tree)}
      </pre>
    )
  }
}
