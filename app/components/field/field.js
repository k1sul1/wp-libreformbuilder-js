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
      'getPopulatedField',
      'getFieldParent',
      'getAbilityToHaveChildren',
    ]
  ]
})
export default class Field extends Component {
  constructor () {
    super()
    this.state = {
      modal: {
        open: false,
      },
    }

    this.renderField = this.renderField.bind(this)
  }

  openModal = (data) => {
    this.setState({ modal: {
      ...this.state.modal,
      ...data,
      open: true,
    }})
  }

  closeModal = () => {
    this.setState({ modal: {
      open: false,
    }})
  }

  addField = (key) => {
    const { getFieldParent, getAbilityToHaveChildren } = this.props
    const addFieldTarget = getAbilityToHaveChildren(key) ? key : getFieldParent(key)
    this.openModal({
      addFieldTarget,
    })
  }

  moveUp = (key, index) => {
    const parent = this.props.getFieldParent(key)
    this.actions.moveField(key, parent, index - 1)
  }

  moveDown = (key, index) => {
    const parent = this.props.getFieldParent(key)
    this.actions.moveField(key, parent, index + 1)
  }

  moveUnder = (key, e) => {
    const target = e.target.value

    this.actions.moveField(key, target, 0)
  }

  moveToTop = (key) => {
    this.actions.moveField(key, 'builder', 0)
  }

  moveToBottom = (key) => {
    this.actions.moveField(key, 'builder', Number.MAX_SAFE_INTEGER)
  }

  renderModal (state) {
    const { builderTree } = this.props
    return (
      <Modal
        isOpen={state.open}
        onRequestClose={this.closeModal}
        contentlabel={'Add field'}>
        <header>
          <h2>Add field</h2>
          <button onClick={this.closeModal}>&times;</button>
        </header>

        <label>
          Target (duplicated code)
          <select defaultValue={state.addFieldTarget}>
            {Object.entries(builderTree)
              .filter(([k, { children }]) => children)
              .map(([key, data]) => (
                <option value={key} key={key}>{key}</option>
              ))}
          </select>
        </label>
      </Modal>
    )
  }

  renderControls (key, index) {
    const { builderTree, origin } = this.props
    return (
      <div className="controls">
        {origin === 'Builder' && (
          <button onClick={() => this.addField(key)}>Add field</button>
        )}
        {origin === 'Builder' && key !== 'builder' && (
          <Fragment>
            <button onClick={() => this.moveToTop(key)}>Move to top</button>
            <button onClick={() => this.moveUp(key, index)}>Move up</button>
            <button onClick={() => this.moveDown(key, index)}>Move down</button>
            <button onClick={() => this.moveToBottom(key)}>Move to bottom</button>
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

  renderField ([key, data], index = 0) {
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
          {this.renderControls(key, index)}
        </header>
        <section>
          {element}
        </section>

        {this.renderModal(this.state.modal)}
      </article>
    )
  }

  render () {
    const { fkey, data } = this.props

    return this.renderField([fkey, data])
  }
}
