import './styles.scss'

import React, { Component } from 'react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { connect } from 'kea'
import builderLogic from './logic'

import Builder from '../../components/builder/builder'
import AllFields from '../../components/all-fields/all-fields'

@DragDropContext(HTML5Backend)
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
  componentDidMount () {
    setTimeout(() => {
      this.actions.moveField('test1', 'builder', 0)
      this.actions.deleteField('test2')
      this.actions.addField('builder', 1, this.props.populatedField('text', {
        attributes: {
          placeholder: 'Kissa'
        },
      }))
    }, 2000)
  }

  render () {
    const { fields, builderTree } = this.props

    return (
      <main>
        <Builder tree={builderTree} actions={this.actions} />
        <AllFields fields={fields} actions={this.actions} />
      </main>
    )
  }
}
