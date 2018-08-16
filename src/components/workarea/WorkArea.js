// eslint is being stupid and keeps complaining even though all of it's needs are fulfilled
// Maybe some day this will support labels that are not nested
/* eslint-disable jsx-a11y/label-has-for */

import './WorkArea.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
// import HTML from 'html-react-parser'
import Modal from 'react-modal'
import { connect } from 'kea'
import { get } from 'lodash'
import HTML from '../HTML/HTML'
import builderLogic from '../../logic/app-logic'
import Button from '../button/Button'
import Icon from '../icon/Icon'
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
  static propTypes = {
    getFieldParent: PropTypes.func.isRequired,
    getAbilityToHaveChildren: PropTypes.func.isRequired,
    getPopulatedField: PropTypes.func.isRequired,
    builderTree: PropTypes.object.isRequired,
    fields: PropTypes.object.isRequired,
    mode: PropTypes.string.isRequired,
    modes: PropTypes.object.isRequired,
  }

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

    if (!target) {
      return
    }

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
    const { getPopulatedField, builderTree } = this.props
    const { addField, editField } = this.actions
    const form = e.target.closest('form') || e.target
    const entries = Array.from(new window.FormData(form).entries())
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    const { target, addUnderField, label, ...attributes } = entries

    const temp = get(builderTree, `${addFieldTarget}.children`, [])
    const targetIndex = temp.length ? temp.indexOf(addUnderField) : 0

    if (edit) {
      editField(addFieldTarget, getPopulatedField(selectedField, { attributes, label }))
    } else {
      addField(
        target,
        targetIndex + 1,
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
              <label key={`${name}-${value}`} htmlFor={`control-${name}`}>
                {name}

                <input type="text" name={name} id={`control-${name}`} defaultValue={value} />
              </label>
            )
          })
        ) : (
          <p>{`Field doen't allow attribute customization`}</p>
        )}

        {label ? (
          <label htmlFor="control-label">
            Field label

            <input type="text" name="label" id="control-label" defaultValue={label} />
          </label>
        ) : (
          <p>{`Field doesn't take a label.`}</p>
        )}
      </div>
    )

    if (selectedField) {
      // console.log(selectedField)
      // const { attributes, label } = getPopulatedField(selectedField)
    }

    if (edit) {
      const currentFieldData = edit ? builderTree[addFieldTarget] : null

      // If field has children, disallow changing field
      const disabled = Boolean(currentFieldData.children && currentFieldData.children.length)

      return (
        <Modal
          isOpen={open}
          onRequestClose={this.closeModal}
          customStyles={{zIndex: 999999999}}
          contentlabel={'Edit field'}
        >
          <div className="wplfb">
            <header className="modal-header">
              <h2>Edit field</h2>
              <Button className="bg-red" type="button" onClick={e => this.closeModal()}>&times;</Button>
            </header>

            <form className="modal-content" ref={n => { this.modalForm = n }} onSubmit={this.handleSubmit}>
              <section className="field-select">
                <h3>Select field</h3>

                <div className="wplfb-button-group">
                  {Object.entries(fields).map(([key, data]) => (
                    <Button
                      type="button"
                      className={selectedField === key ? 'active bg-blue' : ''}
                      disabled={disabled}
                      onClick={(e) => this.actions.editField(addFieldTarget, {
                        ...getPopulatedField(key),
                      }) && this.selectField(key)}
                      key={key}
                    >
                      {data.name || key}
                    </Button>
                  ))}
                </div>

                {disabled && <p>{`Fields that have children can't change field type.`}</p>}
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
          </div>
        </Modal>
      )
    } else {
      return (
        <Modal
          isOpen={open}
          onRequestClose={this.closeModal}
          customStyles={{zIndex: 999999999}}
          contentlabel={'Add field'}>
          <div className="wplfb">
            <header className="modal-header">
              <h2>Add field</h2>
              <Button className="bg-red" type="button" onClick={e => this.closeModal()}>&times;</Button>
            </header>

            <form className="modal-content" ref={n => { this.modalForm = n }} onSubmit={this.handleSubmit}>
              <section className="field-select">
                <h3>Select field</h3>

                <div className="wplfb-button-group">
                  {Object.entries(fields).map(([key, data]) => (
                    <Button
                      type="button"
                      onClick={(e) => this.selectField(key)}
                      className={selectedField === key ? 'active bg-blue' : ''}
                      key={key}
                    >
                      {data.name || key}
                    </Button>
                  ))}
                </div>
              </section>

              <section className="field-target">
                <h3>Target</h3>

                <label htmlFor="wplfb-field-target">
                  <h4>Parent</h4>

                  <select name="target" id={'wplfb-field-target'} readOnly defaultValue={addFieldTarget}>
                    {Object.entries(builderTree)
                      .filter(([k, { children }]) => children)
                      .map(([key, data]) => (
                        <option value={key} key={key}>
                          {key}
                        </option>
                      ))}
                  </select>
                </label>

                {addUnder && (
                  <label htmlFor={'wplfb-field-target-under'}>
                    <h4>Child to add under</h4>

                    <select
                      name="addUnderField"
                      id={'wplfb-field-target-under'}
                      defaultValue={[...targetChildren].reverse()[addFieldIndex]}
                    >
                      {targetChildren
                        .map((key, index) => {
                          const field = builderTree[key]
                          const { attributes } = field

                          let text = `${field.field}`

                          if (attributes && attributes.name) {
                            text += ` - ${attributes.name}`
                          }

                          text += `: ${key}`

                          return (
                            <option value={key} key={key}>
                              {text}
                            </option>
                          )
                        })}
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
          </div>
        </Modal>
      )
    }
  }

  renderControls (key, index) {
    const { builderTree, mode, modes } = this.props

    if (key === 'Root') {
      return (
        <div className="controls wplfb-button-group">
          <Button title="Add field to bottom" className="bg-blue only-item" onClick={(e) => this.addField(key, index)}>
            <Icon icon="plus" srtext="Add field to bottom" />
          </Button>
        </div>
      )
    } else {
      if (modes[mode] === modes.insert) {
        return (
          <div className="controls wplfb-button-group">
            <Button title="Add field here" onClick={(e) => this.addField(key, index)}>
              <Icon icon="plus" srtext="Add field here" />
            </Button>
            <Button title="Edit field" onClick={(e) => this.editField(key, index)}>
              <Icon icon="edit" srtext="Edit field" />
            </Button>
            <Button title="Delete" className="bg-red" onClick={(e) => this.deleteField(key)}>
              <Icon icon="trash-alt" srtext="Delete" />
            </Button>
          </div>
        )
      } else {
        return (
          <div className="controls">
            <div className="wplfb-button-group">
              <Button title="Move upwards" className="bg-gray" onClick={(e) => this.moveUp(key, index)}>
                <Icon icon="arrow-up" srtext="Move upwards" />
              </Button>
              <Button title="Move downwards" className="bg-gray" onClick={(e) => this.moveDown(key, index)}>
                <Icon icon="arrow-down" srtext="Move downwards" />
              </Button>
            </div>

            <div className="bg-gray move-under" title="Move to field">
              <label htmlFor={`wplfb-move-field-${key}`}>
                <Icon icon="plane" srtext="Move to field" />
                <select onBlur={(e) => this.moveUnder(key, e)} id={`wplfb-move-field-${key}`}>
                  <option value="" default>---</option>

                  {Object.entries(builderTree)
                    .filter(([k, { children }]) => k !== key && children)
                    .map(([key, data]) => (
                      <option value={key} key={key}>
                        {data.field ? `${data.field}: ` : ''}
                        {key}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="wplfb-button-group">
              <Button title="Move to top" className="bg-gray" onClick={(e) => this.moveToTop(key)}>
                <Icon icon="angle-double-up" srtext="Move to top" />
              </Button>

              <Button title="Move to bottom" className="bg-gray" onClick={(e) => this.moveToBottom(key)}>
                <Icon icon="angle-double-down" srtext="Move to bottom" />
              </Button>
            </div>

            <Button className="bg-red" onClick={(e) => this.deleteField(key)}>
              <Icon icon="trash-alt" srtext="Delete" />
            </Button>
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
      <Tag {...attributes} readOnly>
        {textContent}
        {children
          .map(id => [id, builderTree[id]])
          .map(([id, data], i) => this.renderField([id, data], i))
        }
      </Tag>
    ) : (
      <Tag {...attributes} readOnly />
    )

    if (template) {
      element = <HTML element={element}>{template}</HTML>
    }

    const heading = name ? `${field}: ${name}` : field

    return (
      <article key={key} data-key={key} className="wplfb-field">
        <section>
          {label ? (
            <label>
              <span className="wplfb-label">
                {label}
              </span>
              {element}
            </label>
          ) : element}
        </section>

        <footer>
          <h4>{heading} <span>({key})</span></h4>
          {this.renderControls(key, index)}
        </footer>
      </article>
    )
  }

  render () {
    const { builderTree } = this.props
    const data = builderTree.Root.children
      .map(id => [id, builderTree[id]])

    return (
      <div className="work-area">
        {data
          .map(([id, data], i) => this.renderField([id, data], i))
        }
        <hr />
        {this.renderControls('Root', 0)}
        {this.renderModal()}
      </div>
    )
  }
}
