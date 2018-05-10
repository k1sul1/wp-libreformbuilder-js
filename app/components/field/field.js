import './styles.scss'

import React, { Component, Fragment } from 'react'
import Modal from 'react-modal'
import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'

Modal.setAppElement('#root')

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
      'builderTree',
      'populatedField'
    ]
  ]
})
export default class Field extends Component {
  constructor () {
    super()
    this.state = {
      modalOpen: false,
    }

    this.renderField = this.renderField.bind(this)
  }

  openModal = () => {
    this.setState({ modalOpen: true })
  }

  closeModal = () => {
    this.setState({ modalOpen: false })
  }

  addField = (key) => {
    this.openModal()
  }

  moveUp = (key) => {
    console.log('move up')
  }

  moveDown = (key) => {
    // this.actions.moveField(
    console.log('move down')
  }

  moveUnder = (key, e) => {
    const target = e.target.value

    this.actions.moveField(key, target, 0)
  }

  renderControls (key) {
    const { builderTree, origin } = this.props
    return (
      <div className="controls">
        {origin === 'Builder' && (
          <button onClick={() => this.addField(key)}>Add field</button>
        )}
        {origin === 'Builder' && key !== 'builder' && (
          <Fragment>
            <button onClick={() => this.moveUp(key)}>Move up</button>
            <button onClick={() => this.moveDown(key)}>Move down</button>
            <label>Move under
              <select onChange={(e) => this.moveUnder(key, e)}>
                <option default>---</option>

                {Object.entries(builderTree)
                  .filter(([k, { children }]) => k !== key && children)
                  .map(([key, data]) => (
                    <option value={key} key={key}>{key}</option>
                  ))}
              </select>
            </label>
          </Fragment>
        )}
      </div>
    )
  }

  renderField ([key, data]) {
    // console.log(key, this.props)
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
          {this.renderControls(key)}
        </header>
        <section>
          {element}
        </section>

        <Modal
          isOpen={this.state.modalOpen}
          onRequestClose={this.closeModal}
          contentlabel={'Add field'}>
          <header>
            <h2>Add field</h2>
            <button onClick={this.closeModal}>&times;</button>
          </header>


          Settings
        </Modal>
      </article>
    )
  }

  render () {
    const { fkey, data } = this.props

    return this.renderField([fkey, data])
  }
}
