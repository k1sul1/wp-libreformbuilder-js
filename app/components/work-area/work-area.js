import './styles.scss'

import React, { Component, Fragment } from 'react'
import Modal from 'react-modal'
import { connect } from 'kea'
import builderLogic from '../../scenes/builder/logic'
// import { renderTree } from '../preview/preview'

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
      'fields',
      'getPopulatedField',
      'getFieldParent',
      'getAbilityToHaveChildren',
    ]
  ]
})
export default class WorkArea extends Component {
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

  selectField = (key) => {
    this.setState({ modal: {
      ...this.state.modal,
      selectedField: key,
    }})
  }

  addField = (key, index) => {
    const { getFieldParent, getAbilityToHaveChildren } = this.props
    const addFieldTarget = getAbilityToHaveChildren(key) ? key : getFieldParent(key)
    this.openModal({
      addFieldTarget,
      addFieldIndex: index,
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

  deleteField = (key) => {
    this.actions.deleteField(key)
  }

  handleSubmit = (e) => {
    const { selectedField, addFieldIndex } = this.state.modal
    const { getPopulatedField } = this.props
    const { addField } = this.actions
    const form = e.target
    const entries = Array.from(new window.FormData(form).entries())
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    const { target, ...attributes } = entries

    addField(
      target,
      addFieldIndex + 1,
      getPopulatedField(selectedField, { attributes })
    )
    this.closeModal()
    e.preventDefault()
  }

  renderModal () {
    const state = this.state.modal
    const { builderTree, fields, getPopulatedField } = this.props

    if (!state.open) {
      return
    }

    const { open, addFieldTarget, selectedField } = state
    let controls

    if (selectedField) {
      const { attributes } = getPopulatedField(selectedField)

      controls = (
        <div className="attribute-customization">
          {attributes ? (
            Object.entries(attributes).map(([name, value]) => {
              return (
                <label key={`${name}-${value}`}>
                  {name}

                  <input type="text" name={name} defaultValue={value} />
                </label>
              )
            })
          ) : (
            <p>{`Field doen't allow attribute customization`}</p>
          )}
        </div>
      )
    }

    return (
      <Modal
        isOpen={open}
        onRequestClose={this.closeModal}
        contentlabel={'Add field'}>
        <header>
          <h2>Add field</h2>
          <button type="button" onClick={this.closeModal}>&times;</button>
        </header>

        <form ref={n => { this.modalForm = n }} onSubmit={this.handleSubmit}>
          <label>
            <h3>Select field</h3>

            {Object.entries(fields).map(([key, data]) => (
              <button type="button" onClick={() => this.selectField(key)} key={key}>{key}</button>
            ))}
          </label>

          {controls}

          <br />
          <label>
            <h3>Target field</h3>

            <select name="target" defaultValue={addFieldTarget}>
              {Object.entries(builderTree)
                .filter(([k, { children }]) => children)
                .map(([key, data]) => (
                  <option value={key} key={key}>{key}</option>
                ))}
            </select>
          </label>

          <button>Add</button>
        </form>
      </Modal>
    )
  }

  renderControls (key, index) {
    const { builderTree, mode, modes } = this.props

    return (
      <div className="controls">
        {modes[mode] === modes.insert && (
          <Fragment>
            <button onClick={() => this.addField(key, index)}>Add field</button>
            <button onClick={() => this.deleteField(key)}>Delete</button>
          </Fragment>
        )}
        {modes[mode] === modes.move && (
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
            <button onClick={() => this.deleteField(key)}>Delete</button>
          </Fragment>
        )}
      </div>
    )
  }

  renderField ([key, data], index = 0) {
    const { builderTree } = this.props
    const { tag: Tag, attributes, children } = data

    const element = children ? (
      <Tag {...attributes}>
        {children
          .map(id => [id, builderTree[id]])
          .map(([id, data], i) => this.renderField([id, data], i))
        }
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
        {this.renderModal()}
      </article>
    )
  }

  render () {
    const { builderTree } = this.props
    const data = builderTree.builder.children
      .map(id => [id, builderTree[id]])

    return (
      <Fragment>
        {data
          .map(([id, data], i) => this.renderField([id, data], i))
        }
      </Fragment>
    )
  }
}
