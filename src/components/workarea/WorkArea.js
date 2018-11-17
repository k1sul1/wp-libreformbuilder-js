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
import { isDevelopment } from '../../utils/env'
import { getFieldAttributeMeta } from '../../utils/field-attribute-meta'

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
    const { edit } = data

    this.setState({
      modal: {
        ...this.state.modal,
        ...data,
        open: true,
      },
    })

    if (edit) {
      const { builderTree } = this.props
      const { addFieldTarget } = data
      const field = builderTree[addFieldTarget]
      const { wplfbattributes, ...attributes } = field.attributes

      this.setState({
        preview: {
          attributes: { ...attributes },
          label: field.label,
        }
      })
    }
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
    const { value, name, type } = target

    if (name === 'label') {
      this.setState({
        preview: {
          ...this.state.preview,
          label: value,
        }
      })
    } else {
      if (type === 'checkbox') {
        const checked = this.state.preview.attributes[name]

        this.setState({
          preview: {
            ...this.state.preview,
            attributes: {
              ...this.state.preview.attributes,
              [name]: checked ? null : '1',
            }
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
    setMode(modes.edit)

    this.setState({
      moveAnywhere: {
        fieldKey: null,
        targetFieldKey: null,
        targetChildToAddAfter: null,
      }
    })
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
      const { target, addUnderField, label, [entries.name]: discarded, ...attributes } = entries

      const temp = get(builderTree, `${addFieldTarget}.children`, [])
      const targetIndex = temp.length ? temp.indexOf(addUnderField) : 0

      const populated = getPopulatedField(selectedField, { attributes, label })
      console.log(target, targetIndex + 1, entries, populated)
      // populated.children = Array.isArray(populated.children) ? [] : false

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
    attrData = getFieldAttributeMeta(name, attrData)
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
        // Value is forced as 1, because checked comparison
        // wouldn't work if it were a freely chosen value

        return (
          <input {...getAttrs({
            type: 'checkbox',
            value: '1',
            checked: value === '1',
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

  printAttribute = ([name, value], attrData) => {
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
    htmlFor: 'for',
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
          }).reverse().map(pair => this.printAttribute(pair, attrData))
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
              <Button className="bg-red" type="button" onClick={e => this.closeModal()}>
                <Icon icon="times" srtext="Close" />
              </Button>
            </header>

            <form className="modal-content" ref={n => { this.modalForm = n }} onSubmit={this.handleSubmit}>
              <section className="field-select">
                <h3>Select field</h3>

                <div className="wplfb-button-group">
                  {Object.entries(fields).map(([key, data]) => (
                    <Button
                      type="button bg-gray"
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
                  { renderControls: false, renderName: false, }
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

              {selectedField && (
                <Button onClick={this.handleSubmit} className="bg-blue">Save</Button>
              )}
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

                {selectedField && console.log(selectedField, getPopulatedField(selectedField, {
                  label: this.state.preview.label,
                  attributes: this.state.preview.attributes,
                }))}
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

              {selectedField && (
                <Button onClick={this.handleSubmit} className="bg-blue">Add</Button>
              )}
            </form>
          </div>
        </Modal>
      )
    }
  }

  renderControls (key, index) {
    const { builderTree } = this.props
    const isWrapperField = Array.isArray(builderTree[key].children)
    const parent = isWrapperField && this.props.getFieldParent(key)

    if (key === 'Root') {
      return (
        <div className="controls wplfb-button-group">
          <Button title="Add field to bottom" className="bg-blue only-item" onClick={(e) => this.addField(key, index)}>
            <Icon icon="plus" srtext="Add field to bottom" />
          </Button>
        </div>
      )
    } else {
      return (
        <div className="controls">
          <div className="wplfb-button-group">
            <Button title="Move anywhere" className="bg-gray" onClick={() => this.startMoveAnywhere(key)}>
              <Icon icon="arrows-alt" srtext="Move anywhere" />
            </Button>
            <Button title="Move upwards" className="bg-gray" onClick={() => this.moveUp(key, index)}>
              <Icon icon="arrow-up" srtext="Move upwards" />
            </Button>
            <Button title="Move downwards" className="bg-gray" onClick={() => this.moveDown(key, index)}>
              <Icon icon="arrow-down" srtext="Move downwards" />
            </Button>
          </div>

          <div className="wplfb-button-group">
            {isWrapperField && (
              <Button title="Add field inside" className="bg-gray" onClick={(e) => this.addField(key, index)}>
                <Icon icon="plus-square" srtext="Add field inside" />
              </Button>
            )}
            <Button title="Add field under" className="bg-gray" onClick={(e) => isWrapperField
              ? this.addField(parent, index)
              : this.addField(key, index)
            }>
              <Icon icon="plus" srtext="Add field under" />
            </Button>
            <Button title="Edit field" className="bg-gray" onClick={(e) => this.editField(key, index)}>
              <Icon icon="edit" srtext="Edit field" />
            </Button>

            <Button className="bg-red" onClick={(e) => this.deleteField(key)}>
              <Icon icon="trash-alt" srtext="Delete" />
            </Button>
          </div>
        </div>
      )
    }
  }

  renderField ([key, data], index = 0, parent = 'Root', options = {
    renderControls: true,
    renderName: true, // if false, don't render the name attribute
  }) {

    if (!data) {
      console.log('wtf?', { key, data, index, parent, options })
      return false
    }

    const { builderTree, mode, modes } = this.props
    const { tag: Tag, attributes, children, template, label, field } = data
    const { name, ...attrs } = attributes || {}
    const isMoveAnywhere = mode === modes.moveAnywhere
    const isBeingMoved = isMoveAnywhere && this.state.moveAnywhere.fieldKey === key
    const isBeingMovedInto = isMoveAnywhere && this.state.moveAnywhere.targetFieldKey === key
    // console.log('children', key, children)
    let element = children ? (
      <Tag name={options.renderName ? name : null} {...attrs} readOnly>
        {isMoveAnywhere && (
          <Button
            className="wplfb-ma-move-here-wrapper bg-blue"
            onClick={() => this.completeMoveAnywhere(key, null)}
          >
            Move field here
          </Button>
        )}
        {/*children
          .map(id => [id, builderTree[id]])
          .map(([id, data], i) => this.renderField([id, data], i, key))
        */}
        {children
          .map((x, i) => {
            const isComponent = typeof x === 'string'

            if (isComponent) {
              // x is child key
              const child = builderTree[x] || {}

              return this.renderField([x, child], i, key)
            }

            const { type = 'component', tag, props } = x
            console.log({ x, type, tag, props })
            if (type === 'html') {
              if (tag !== 'textNode') {
                const Tag = tag
                
                return <Tag {...props} key={`c-${tag}-${i}`}/>
              }

              return typeof props.children === 'string' 
                ? props.children
                : props.children.join('')
              // return "kissa";
              // return props.children[0] // Should only contain one
            } else {
              console.log('what the fuck is happening', x)
            }

            return null
          })
        }
        {false && children && isDevelopment() && <div>
          <strong>Children</strong>
          {JSON.stringify(children, null, 2)}
        </div>}
      </Tag>
    ) : (
      <Tag name={options.renderName ? name : null} {...attrs} readOnly disabled={Tag === 'button' || attributes.type === 'submit'} />
    )

    if (template) {
      element = <HTML element={element}>{template}</HTML>
    }

    const fieldIdentifier = (
      <span className="wplfb-field-identifier" data-label="Field">
        {data.name}[{field}]
      </span>
    )
    const heading = name
      ? (
        <Fragment>
          {fieldIdentifier}
          <span className="wplfb-field-name" data-label="Input name">{name}</span>
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
          <h4>
            {heading}
            {isDevelopment() && <span className="wplfb-field-key" data-label="Field key">({key})</span>}
          </h4>
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
        {this.renderControls('Root', builderTree['Root'].children.length - 1)}
        {this.renderModal()}
      </div>
    )
  }
}
