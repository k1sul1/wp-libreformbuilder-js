// eslint is being stupid and keeps complaining even though all of it's needs are fulfilled
/* eslint-disable jsx-a11y/label-has-for */

import './WorkArea.scss'

import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
// import HTML from 'html-react-parser'
import Modal from 'react-modal'
import { connect } from 'kea'
import { get } from 'lodash'
import HTML from '../HTML/HTML'
import builderLogic from '../../logic/app-logic'
import Button from '../button/Button'
import Icon from '../icon/Icon'

Modal.setAppElement('#wplfb_buildarea')

@connect({
  actions: [
    builderLogic, [
      'addField',
      'editField',
      'moveField',
      'deleteField',
      'setMode',
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
    mode: PropTypes.object.isRequired,
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
        addUnderField: null,
        edit: false,
      },
      preview: {
        attributes: {

        },
        label: null,
      },
      moveAnywhere: {
        fieldKey: null,
        targetFieldKey: null, // needed in state for transition (maybe)
        targetChildToAddAfter: null,
      }
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
    this.setState({
      modal: {
        open: false,
        edit: false,
        selectedField: null,
      },
      preview: {
        attributes: {},
        label: null,
      }
    })
  }

  selectField = (key) => {
    this.setState({
      modal: {
        ...this.state.modal,
        selectedField: key,
      },
      preview: {
        attributes: {},
        label: null,
      }
    })
  }

  updatePreview = e => {
    const { target } = e
    const { value, name } = target

    if (name === 'label') {
      this.setState({
        preview: {
          ...this.state.preview,
          label: value,
        }
      })
    } else {
      this.setState({
        preview: {
          ...this.state.preview,
          attributes: {
            ...this.state.preview.attributes,
            [name]: value,
          }
        }
      })
    }
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

  startMoveAnywhere = (key) => {
    const { modes } = this.props
    const { setMode } = this.actions

    setMode(modes.moveAnywhere)

    this.setState({
      moveAnywhere: {
        ...this.state.moveAnywhere,
        fieldKey: key,
      }
    })
  }

  async completeMoveAnywhere (parent, childToAddAfter) {
    await new Promise(resolve => {
      this.setState({
        moveAnywhere: {
          ...this.state.moveAnywhere,
          targetFieldKey: parent,
          targetChildToAddAfter: childToAddAfter,
        }
      }, resolve)
    })

    const { moveAnywhere } = this.state
    const { fieldKey, targetFieldKey, targetChildToAddAfter } = moveAnywhere
    const { builderTree, modes } = this.props
    const { setMode, moveField } = this.actions
    const target = builderTree[targetFieldKey]
    const preciseTarget = target.children.indexOf(targetChildToAddAfter) + 1

    // await new Promise(resolve => setTimeout(resolve, 300))
    moveField(fieldKey, targetFieldKey, preciseTarget)
    setMode(modes.move)

    this.setState({
      moveAnywhere: {
        fieldKey: null,
        targetFieldKey: null,
        targetChildToAddAfter: null,
      }
    })
  }

  moveToTop = (key) => {
    this.actions.moveField(key, 'Root', 0)
  }

  moveToBottom = (key) => {
    this.actions.moveField(key, 'Root', Number.MAX_SAFE_INTEGER)
  }

  deleteField = (key) => {
    this.actions.deleteField(key)
  }

  handleSubmit = (e) => {
    try {
      const { selectedField, edit, addFieldTarget } = this.state.modal
      const { getPopulatedField, builderTree } = this.props
      const { addField, editField } = this.actions
      const form = e.target.closest('form') || e.target
      const entries = Array.from(new window.FormData(form).entries())
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
      const { target, addUnderField, label, ...attributes } = entries

      const temp = get(builderTree, `${addFieldTarget}.children`, [])
      const targetIndex = temp.length ? temp.indexOf(addUnderField) : 0

      const populated = getPopulatedField(selectedField, { attributes, label })
      populated.children = Array.isArray(populated.children) ? [] : false
      // populated.id = shortid.generate()
      // populated.id = Date.now()
      // console.log(target, '\n', populated, '\n', temp)

      if (edit) {
        editField(addFieldTarget, populated)
      } else {
        addField(
          target,
          targetIndex + 1,
          populated
        )
      }
      this.closeModal()
      e.preventDefault()
    } catch (e) {
      console.error(e)
    }
  }

  getInput = (name, value, attrData = undefined) => {
    const defaultData = {
      type: ['required'].indexOf(name) > -1 ? 'checkbox' : 'text', // Default checkbox attributes
      readOnly: null,
      hidden: ['type'].indexOf(name) > -1, // Default blacklisted attributes
    }

    if (!attrData) {
      attrData = defaultData
    } else {
      attrData = { ...defaultData, ...attrData }
    }

    const { type, hidden, readOnly } = attrData

    if (hidden) {
      return false
    }

    const getAttrs = (attrs = {}) => ({
        name,
        readOnly,
        id: `control-${name}`,
        value,
        onChange: this.updatePreview,
       ...attrs,
    })

    switch (type) {
      case 'checkbox': {
        return (
          <input {...getAttrs({
            type: 'checkbox',
            value: value || 1
          })} />
        )
      }

      case 'text': {
        return (
          <input {...getAttrs({ type: 'text' })} />
        )
      }

      default: {
        console.error(`Invalid type ${attrData.type} for input ${name}, defaulting to text`)
        return this.getInput(name, value)
      }
    }
  }

  printAttributes = ([name, value], attrData) => {
    const saneName = this.getName(name)
    const input = this.getInput(name, value, attrData[saneName])

    if (input) {
      return (
        <label key={name} htmlFor={`control-${name}`}>
          <strong>{saneName}</strong>

          {input}
        </label>
      )
    } else {
      return null
    }
  }

  getName = (name) => (({
    className: 'class',
  })[name] || name)

  renderModalControls = ({ attributes, label }) => {
    const { 'wplfbattributes': rawAttrData, ...attrs } = attributes
    let attrData = {}

    if (rawAttrData) {
      try {
        attrData = JSON.parse(rawAttrData)
      } catch (e) {
        console.error('Unable to parse attribute data, falling back to default', e)
      }
    }

    return (
      <div className="wplfb-attribute-customization">
        {attrs ? (
          Object.entries({
            ...attrs,
            ...this.state.preview.attributes,
          }).reverse().map(pair => this.printAttributes(pair, attrData))
        ) : (
          <p>{`Field doen't allow attribute customization`}</p>
        )}

        {label ? (
          <label htmlFor="control-label">
            Field label

            <input type="text" name="label" id="control-label"
              onChange={this.updatePreview}
              defaultValue={this.state.preview.label || label} />
          </label>
        ) : (
          <p>{`Field doesn't take a label.`}</p>
        )}
      </div>
    )
  }

  // Hack to not lose focus when typing into attributes because re-render happens
  /* shouldComponentUpdate (newProps, newState) {
    if (!isEqual(newState.preview, this.state.preview)) {
      return false
    }

    return true
  } */

  renderModal () {
    const state = this.state.modal
    const { builderTree, fields, getPopulatedField } = this.props

    if (!state.open) {
      return
    }

    const { open, addFieldTarget, addFieldIndex, selectedField, edit } = state
    const targetChildren = builderTree[addFieldTarget].children

    const defaultValue = [...targetChildren][addFieldIndex]

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
                      {data.name ? `${data.name}[${key}]` : key}
                    </Button>
                  ))}
                </div>

                {disabled && <p>{`Fields that have children can't change field type.`}</p>}
              </section>

              <section className="field-target">
                <h3>Preview</h3>

                {selectedField ? this.renderField(
                  [addFieldTarget, getPopulatedField(
                    selectedField,
                    {
                      ...builderTree[addFieldTarget],
                      ...{
                        label: this.state.preview.label,
                        attributes: this.state.preview.attributes,
                      },
                    }
                  )],
                  0,
                  'Root',
                  { renderControls: false }
                ) : (
                  <p>Select field to display preview</p>
                )}
              </section>

              <section className="field-attributes">
                <h3>Attributes</h3>
                {selectedField
                  ? this.renderModalControls({
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
                      {data.name ? `${data.name}[${key}]` : key}
                    </Button>
                  ))}
                </div>
              </section>

              <section className="field-target">
                <h3>Preview</h3>

                <input type="hidden" value={addFieldTarget} name="target" />
                <input type="hidden" value={defaultValue} name="addUnderField" />

                {defaultValue && this.renderField(
                  [defaultValue, builderTree[defaultValue]],
                  addFieldIndex,
                  addFieldTarget,
                  { renderControls: false }
                )}
                {selectedField ? this.renderField(
                  ['preview', getPopulatedField(selectedField, {
                    label: this.state.preview.label,
                    attributes: this.state.preview.attributes,
                  })],
                  0,
                  'Root',
                  { renderControls: false }
                ) : (
                  <p>Select field to display preview</p>
                )}
              </section>

              <section className="field-attributes">
                <h3>Attributes</h3>
                {selectedField
                  ? this.renderModalControls(getPopulatedField(selectedField))
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
    const { mode, modes } = this.props

    if (key === 'Root') {
      return (
        <div className="controls wplfb-button-group">
          <Button title="Add field to bottom" className="bg-blue only-item" onClick={(e) => this.addField(key, index)}>
            <Icon icon="plus" srtext="Add field to bottom" />
          </Button>
        </div>
      )
    } else {
      if (mode === modes.insert) {
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
              <Button title="Move upwards" className="bg-gray" onClick={() => this.moveUp(key, index)}>
                <Icon icon="arrow-up" srtext="Move upwards" />
              </Button>
              <Button title="Move downwards" className="bg-gray" onClick={() => this.moveDown(key, index)}>
                <Icon icon="arrow-down" srtext="Move downwards" />
              </Button>
              <Button title="Move anywhere" className="bg-gray" onClick={() => this.startMoveAnywhere(key)}>
                <Icon icon="arrows-alt" srtext="Move anywhere" />
              </Button>
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

  renderField ([key, data], index = 0, parent = 'Root', options = {
    renderControls: true,
  }) {

    const { builderTree, mode, modes } = this.props
    const { tag: Tag, attributes, children, template, label, field } = data
    const { name } = attributes
    const isMoveAnywhere = mode === modes.moveAnywhere
    const isBeingMoved = isMoveAnywhere && this.state.moveAnywhere.fieldKey === key
    const isBeingMovedInto = isMoveAnywhere && this.state.moveAnywhere.targetFieldKey === key
    let element = children ? (
      <Tag {...attributes} readOnly>
        {isMoveAnywhere && (
          <Button
            className="wplfb-ma-move-here-wrapper bg-blue"
            onClick={() => this.completeMoveAnywhere(key, null)}
          >
            Move field here
          </Button>
        )}
        {children
          .map(id => [id, builderTree[id]])
          .map(([id, data], i) => this.renderField([id, data], i, key))
        }
      </Tag>
    ) : (
      <Tag {...attributes} readOnly />
    )

    if (template) {
      element = <HTML element={element}>{template}</HTML>
    }

    const fieldIdentifier = (
      <span className="wplfb-field-identifier">
        {data.name}[{field}]
      </span>
    )
    const heading = name
      ? (
        <Fragment>
          <span className="wplfb-field-name">{name}</span>
          {fieldIdentifier}
        </Fragment>
      )
      : fieldIdentifier

    const cn = [
      'wplfb-field',
      isMoveAnywhere ? 'wplfb-ma-show-controls' : '',
      isBeingMoved ? 'wplfb-ma-movesource' : '',
      isBeingMovedInto ? 'wplfb-ma-movetarget' : '',
      isMoveAnywhere && children ? 'wplfb-ma-wrapper' : '',
    ].join(' ')

    const fieldNode = (
      <article key={key} data-key={key} className={cn}>
        <section>
          <div className="flexcenter">
            {label ? (
              <label>
                <span className="wplfb-label">
                  {label}
                </span>
                {element}
              </label>
            ) : element}
          </div>
        </section>

        <footer>
          <h4>{heading} <span className="wplfb-field-key">({key})</span></h4>
          {options.renderControls && this.renderControls(key, index)}
        </footer>
      </article>
    )

    if (isMoveAnywhere) {
      return (
        <Fragment key={`ma-${key}`}>
          {fieldNode}

          {isMoveAnywhere && (
            <Button
              className="wplfb-ma-move-here bg-blue"
              onClick={() => this.completeMoveAnywhere(parent, key)}
            >
              Move field here
            </Button>
          )}
        </Fragment>
      )
    } else {
      return fieldNode
    }
  }

  render () {
    const { builderTree, mode, modes } = this.props
    const isMoveAnywhere = mode === modes.moveAnywhere
    const data = builderTree.Root.children
      .map(id => [id, builderTree[id]])

    return (
      <div className={`work-area ${isMoveAnywhere ? 'wplfb-ma-wrapper' : ''}`}>
        {isMoveAnywhere && (
          <Button
            className="wplfb-ma-move-here bg-blue"
            onClick={() => this.completeMoveAnywhere('Root', 0)}
          >
            Move field here
          </Button>
        )}
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
