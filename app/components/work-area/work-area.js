import './work-area.scss'

import React, { Component } from 'react'
// import HTML from 'html-react-parser'
import Modal from 'react-modal'
import { connect } from 'kea'
import HTML from '../HTML/HTML'
import builderLogic from '../../scenes/builder/logic'
import Button from '../button/Button'
// import { renderTree } from '../preview/preview'

Modal.setAppElement('#wplfb_buildarea')

@connect({
  actions: [
    builderLogic, [
      'addField',
      'editField',
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
        selectedField: null,
        addFieldTarget: null,
        addFieldIndex: null,
        edit: false,
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
      edit: false,
      selectedField: null,
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

  editField = (key, index) => {
    const field = this.props.builderTree[key]

    this.openModal({
      addFieldTarget: key,
      addFieldIndex: index,
      selectedField: field.field,
      edit: field,
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
    const { selectedField, edit, addFieldTarget } = this.state.modal
    const { getPopulatedField } = this.props
    const { addField, editField } = this.actions
    const form = e.target.closest('form') || e.target
    const entries = Array.from(new window.FormData(form).entries())
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    const { target, targetIndex, label, ...attributes } = entries

    if (edit) {
      editField(addFieldTarget, getPopulatedField(selectedField, { attributes, label }))
    } else {
      addField(
        target,
        parseInt(targetIndex) + 1,
        getPopulatedField(selectedField, { attributes, label })
      )
    }
    this.closeModal()
    e.preventDefault()
  }

  renderModal () {
    const state = this.state.modal
    const { builderTree, fields, getPopulatedField } = this.props

    if (!state.open) {
      return
    }

    const { open, addFieldTarget, addFieldIndex, selectedField, edit } = state
    const targetChildren = builderTree[addFieldTarget].children
    const addUnder = targetChildren[addFieldIndex]
    // let controls

    const controls = ({ attributes, label }) => (
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

        {label ? (
          <label>
            Field label

            <input type="text" name="label" defaultValue={label} />
          </label>
        ) : (
          <p>Field doesn't take a label.</p>
        )}
      </div>
    )

    if (selectedField) {
      // console.log(selectedField)
      // const { attributes, label } = getPopulatedField(selectedField)
    }

    if (edit) {
      const currentFieldData = edit ? builderTree[addFieldTarget] : null

      return (
        <Modal
          isOpen={open}
          onRequestClose={this.closeModal}
          customStyles={{zIndex: 999999999}}
          contentlabel={'Edit field'}>
          <header className="modal-header">
            <h2>Edit field</h2>
            <Button className="bg-red" type="button" onClick={e => e.preventDefault() || this.closeModal()}>&times;</Button>
          </header>

          <form className="modal-content" ref={n => { this.modalForm = n }} onSubmit={this.handleSubmit}>
            <section className="field-select">
              <label>
                <h3>Select field</h3>

                <div className="wplfb-button-group">
                  {Object.entries(fields).map(([key, data]) => (
                    <Button
                      type="button"
                      className={edit ? currentFieldData.field === key && 'active bg-blue' : ''}
                      onClick={(e) => e.preventDefault() || this.selectField(key)}
                      key={key}
                    >
                    {key}
                  </Button>
                  ))}
                </div>
              </label>
            </section>

            <section className="field-attributes">
              <h3>Attributes</h3>
              {selectedField
                ? controls({
                  ...getPopulatedField(selectedField),
                  ...currentFieldData,
                }) : <p>Select field first.</p>
              }
            </section>

            {selectedField && <Button onClick={this.handleSubmit}>Save</Button>}
          </form>
        </Modal>
      )
    } else {
      return (
        <Modal
          isOpen={open}
          onRequestClose={this.closeModal}
          customStyles={{zIndex: 999999999}}
          contentlabel={'Add field'}>
          <header className="modal-header">
            <h2>{edit ? 'Edit field' : 'Add field'}</h2>
            <Button className="bg-red" type="button" onClick={e => e.preventDefault() || this.closeModal()}>&times;</Button>
          </header>

          <form className="modal-content" ref={n => { this.modalForm = n }} onSubmit={this.handleSubmit}>
            <section className="field-select">
              <label>
                <h3>Select field</h3>

                <div className="wplfb-button-group">
                  {Object.entries(fields).map(([key, data]) => (
                    <Button
                      type="button"
                      onClick={(e) => e.preventDefault() || this.selectField(key)}
                      key={key}
                    >
                    {key}
                  </Button>
                  ))}
                </div>
              </label>
            </section>

            <section className="field-target">
              <h3>Target</h3>

              <label>
                <h4>Parent</h4>

                <select name="target" readOnly defaultValue={addFieldTarget}>
                  {Object.entries(builderTree)
                    .filter(([k, { children }]) => children)
                    .map(([key, data]) => (
                      <option value={key} key={key}>{key}</option>
                    ))}
                </select>
              </label>

              {addUnder && (
                <label>
                  <h4>Child to add under</h4>

                  <select name="targetIndex" defaultValue={addFieldIndex}>
                    {targetChildren
                      .map((key, index) => (
                        <option value={index} key={key}>{key}</option>
                      ))}
                  </select>
                </label>
              )}
            </section>

            <section className="field-attributes">
              <h3>Attributes</h3>
              {selectedField
                ? controls(getPopulatedField(selectedField))
                : <p>Select field first.</p>
              }
            </section>

            {selectedField && <Button onClick={this.handleSubmit}>Add</Button>}
          </form>
        </Modal>
      )
    }
  }

  renderControls (key, index) {
    const { builderTree, mode, modes } = this.props

    if (key === 'builder') {
      return (
        <div className="controls wplfb-button-group">
          <Button className="bg-blue only-item" onClick={(e) => e.preventDefault() || this.addField(key, index)}>Add field</Button>
        </div>
      )
    } else {
      if (modes[mode] === modes.insert) {
        return (
          <div className="controls wplfb-button-group">
            <Button onClick={(e) => e.preventDefault() || this.addField(key, index)}>Add field</Button>
            <Button onClick={(e) => e.preventDefault() || this.editField(key, index)}>Edit field</Button>
            <Button className="bg-red" onClick={(e) => e.preventDefault() || this.deleteField(key)}>Delete</Button>
          </div>
        )
      } else {
        return (
          <div className="controls wplfb-button-group">
            <Button className="bg-gray" onClick={(e) => e.preventDefault() || this.moveToTop(key)}>Move to top</Button>
            <Button className="bg-gray" onClick={(e) => e.preventDefault() || this.moveUp(key, index)}>Move up</Button>
            <Button className="bg-gray" onClick={(e) => e.preventDefault() || this.moveDown(key, index)}>Move down</Button>
            <Button className="bg-gray" onClick={(e) => e.preventDefault() || this.moveToBottom(key)}>Move to bottom</Button>
            <Button className="bg-gray">
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
            </Button>
            <Button className="bg-red" onClick={(e) => e.preventDefault() || this.deleteField(key)}>Delete</Button>
          </div>
        )
      }
    }
  }

  renderField ([key, data], index = 0) {
    const { builderTree } = this.props
    const { tag: Tag, attributes, children, template, label, field } = data
    const { name } = attributes
    const textContent = attributes['data-text']
    let element = children ? (
      <Tag {...attributes}>
        {textContent}
        {children
          .map(id => [id, builderTree[id]])
          .map(([id, data], i) => this.renderField([id, data], i))
        }
      </Tag>
    ) : (
      <Tag {...attributes} />
    )

    // console.log(data)

    if (template) {
      element = <HTML element={element}>{template}</HTML>
    }

    const heading = name ? `${field}: ${name}` : field

    return (
      <article key={key} data-key={key} className="wplf-field">
        <header>
          <h4>{heading}</h4>
          {this.renderControls(key, index)}
        </header>
        <section>
          {label ? (
            <label>
              <span className="wplf-label">
                {label}
              </span>
              {element}
            </label>
          ) : element}
        </section>
      </article>
    )
  }

  render () {
    const { builderTree } = this.props
    const data = builderTree.builder.children
      .map(id => [id, builderTree[id]])

    return (
      <div className="work-area">
        {this.renderControls('builder', 0)}
        {data
          .map(([id, data], i) => this.renderField([id, data], i))
        }
        {this.renderModal()}
      </div>
    )
  }
}
