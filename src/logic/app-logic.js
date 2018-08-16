import { kea } from 'kea'
import { put } from 'redux-saga/effects'
import { merge } from 'lodash'
import shortid from 'shortid'
import PropTypes from 'prop-types'
import req from '../utils/req'

const dirtyParser = (html) => {
  let el = document.createElement('div')
  el.innerHTML = html
  el = el.children[0]

  const attributes = {}

  for (let i = el.attributes.length - 1; i >= 0; i--) {
    const k = el.attributes[i].name
    const v = el.attributes[i].value

    switch (k) {
    case 'class': {
      attributes['className'] = v
      break
    }

    case 'for': {
      attributes['htmlFor'] = v
      break
    }

    default: {
      attributes[k] = v
      break
    }
    }
  }

  return [el.tagName.toLowerCase(), attributes]
}

const logReturn = x => console.log(x) || x
const objectFromArray = (obj, [k, v]) => ({ ...obj, [k]: v })
const defaultFields = {
  /* wrapper: {
    children: [],
    template: `<div class="outer"><h1>Heading</h1><div class="wplfb-field-container"></div></div>`,
    label: false,
    tag: 'div',
    attributes: {
      className: 'wplfb-child-container',
    }
  },
  text: {
    children: false,
    template: `<div><h2>PERKELE</h2><div class="wplfb-field-container"></div></div>`,
    label: 'Text field label',
    tag: 'input',
    attributes: {
      type: 'text',
      placeholder: 'Test',
      name: 'text-input',
    }
  }, */
}
const defaultBuilderTree = {
  Root: {
    children: [],
  },
}

const MODE_INSERT = 0
const MODE_MOVE = 1
const MODE_PREVIEW = 2

export const MODES = {
  MODE_INSERT,
  MODE_MOVE,
  MODE_PREVIEW,
}

const builderModes = {
  available: {
    insert: MODE_INSERT,
    move: MODE_MOVE,
    preview: MODE_PREVIEW,
  },
  enabled: MODE_INSERT,
}

export default kea({
  path: () => ['scenes', 'builder'],

  constants: () => [
  ],

  actions: ({ constants }) => ({
    import: (data) => data,
    export: ({ stateInput, contentEl }) => ({ stateInput, contentEl }),

    setHTML: (html) => html,

    setMode: (mode) => mode,
    addAvailableField: (key, data) => ({ [key]: data }),

    addField: (toFieldKey, toFieldIndex, fieldData) => ({
      to: toFieldKey,
      toIndex: toFieldIndex,
      data: fieldData,
    }),
    editField: (fieldKey, data) => ({ field: fieldKey, data }),
    moveField: (startFieldKey, toFieldKey, toFieldIndex) => ({
      from: startFieldKey,
      to: toFieldKey,
      toIndex: toFieldIndex,
    }),
    deleteField: (fieldKey) => ({ fieldKey }),
  }),

  reducers: ({ actions, constants }) => ({
    mode: [builderModes, PropTypes.object, {}, {
      [actions.setMode]: (state, payload) => ({ ...state, enabled: payload }),
    }],
    fields: [defaultFields, PropTypes.object, {}, {
      [actions.addAvailableField]: (state, payload) => {
        const [key, data] = Object.entries(payload)[0]
        const { field, ...filtered } = data
        const [tag, attributes] = dirtyParser(field)

        // If field contains a string "wplfb-child-container", allow putting children inside this field.
        const children = data.field.indexOf('wplfb-child-container') !== -1 ? [] : false
        const fieldObj = {
          [key]: {
            children,
            tag,
            attributes,
            ...filtered,
          }
        }

        return ({ ...state, ...fieldObj })
      },
    }],

    previewHTML: ['', PropTypes.string, {
      [actions.setHTML]: (state, payload) => payload,
    }],

    builderTree: [defaultBuilderTree, PropTypes.object, { persist: true }, {
      [actions.addField]: (state, payload) => {
        const { to, toIndex, data } = payload
        const { id, ...rest } = data // Use populatedField selector to populate `rest`

        if (!state[to]) {
          throw new Error(`Attempted to add a new field to a nonexistent parent ${to}`)
        }

        const children = state[to].children
        children.splice(toIndex, 0, id)

        return {
          ...state,
          [to]: {
            ...state[to],
            children
          },
          [id]: rest,
        }
      },
      [actions.editField]: (state, payload) => {
        const { field, data } = payload

        if (!state[field]) {
          throw new Error(`Can't edit non-existent field ${field}`)
        }

        return {
          ...state,
          ...{
            [field]: data,
          },
        }
      },

      [actions.moveField]: (state, payload) => {
        const { from, to, toIndex } = payload
        const draft = Object.entries(state)
          .map(([key, data]) => {
            const { children } = data

            if (children) {
              const posInChildren = Array.isArray(children) ? children.indexOf(from) : -1

              // remove if exists
              if (posInChildren > -1) {
                children.splice(posInChildren, 1)
              }
            }

            if (key === to) {
              if (!children) {
                throw new Error(`Attempted to move field ${from} to ${to}, which is a field that doesn't accept children.`)
              }

              // Add field to it's new home in `to` at `toIndex`
              children.splice(toIndex, 0, from)
            }

            return [key, data]
          })
          .reduce(objectFromArray, {})

        return draft
      },

      /**
       * Delete field. Saga deletes everything inside too.
       */
      [actions.deleteField]: (state, payload) => {
        const { fieldKey } = payload
        const entries = Object.entries(state)

        return logReturn(entries
          .map(([key, data]) => {
            const { children } = data
            const posInChildren = Array.isArray(children) ? children.indexOf(fieldKey) : -1

            if (posInChildren > -1) {
              children.splice(posInChildren, 1)
            }

            return [key, data]
          })
          .filter(([key, data]) => key !== fieldKey)
          .reduce(objectFromArray, {}))
      },
    }],
  }),

  start: function * () {
    const actions = this.actions
    const fieldReq = yield req.get('/wp-json/wplfb/fields')
    const { data } = fieldReq
    const fields = Object.entries(data.fields)

    for (let i = 0; i < fields.length; i++) {
      const [index, data] = fields[i]
      const key = `${data.name}-${index}`

      yield put(actions.addAvailableField(key, data))
    }

    // console.log(fields)
  },

  takeEvery: ({ actions, workers }) => ({
    '*': function * ({ payload }) {
      // implement undo/redo
    },
    [actions.import]: function * ({ payload }) {
      try {
        const newState = JSON.parse(payload)
        const state = yield this.get()
        const importable = ['builderTree']

        for (let i = 0; i < importable.length; i++) {
          const key = importable[i]

          if (newState[key]) {
            state[key] = newState[key]
          }
        }

        console.log(newState, state)
      } catch (e) {
        console.log('No valid payload provided, skipping import')
      }
    },
    [actions.export]: function * ({ payload }) {
      try {
        const state = yield this.get()
        const { stateInput, contentEl } = payload
        const exportable = ['builderTree']
        const exportObj = {}

        for (let i = 0; i < exportable.length; i++) {
          const key = exportable[i]

          if (state[key]) {
            exportObj[key] = state[key]
          }
        }

        console.log(exportObj)

        if (stateInput && contentEl) {
          stateInput.value = JSON.stringify(exportObj)
          contentEl.value = state.previewHTML
        }
      } catch (e) {
        console.log('No valid payload provided, skipping import')
      }
    },
    /**
     * Delete every field which isn't anywhere
     */
    [actions.deleteField]: function * (params) {
      const entries = Object.entries(yield this.get('builderTree'))
      const allChildren = entries
        .filter(([key, { children }]) => children !== false)
        .reduce((acc, [key, { children }]) => [...acc, ...children], [])
      const notAnywhere = entries.filter(([key]) => (
        key !== 'Root' && allChildren.indexOf(key) === -1
      )).map(([key]) => key)

      for (let i = 0; i < notAnywhere.length; i++) {
        yield put(actions.deleteField(notAnywhere[i]))
      }
    },
  }),

  // SELECTORS (data from reducer + more)
  selectors: ({ constants, selectors }) => ({
    modes: [
      () => [selectors.mode],
      ({ available }) => ({ ...available }),
      PropTypes.object
    ],
    textMode: [
      () => [selectors.mode],
      ({ available, enabled }) => {
        const modeIndex = Object.values(available).indexOf(enabled)
        const modeText = Object.keys(available)[modeIndex]

        return modeText
      },
      PropTypes.string
    ],
    mode: [
      () => [selectors.mode],
      ({ enabled }) => enabled,
      PropTypes.number
    ],
    getPopulatedField: [
      () => [selectors.fields],
      (field) => {
        return (key, overwriteWith) => merge(
          field[key],
          { id: shortid.generate(), field: key },
          overwriteWith
        )
      },
      PropTypes.func
    ],
    getFieldParent: [
      () => [selectors.builderTree],
      (tree) => (k) => Object.entries(tree)
        .filter(([key, { children }]) => children && children.indexOf(k) > -1)
        .map(([key]) => key)[0] || false,
      PropTypes.func
    ],
    getAbilityToHaveChildren: [
      () => [selectors.builderTree],
      (tree) => (k) => Object.entries(tree)
        .filter(([key, { children }]) => k === key && Boolean(children))
        .map(([key]) => key)[0] || false,
      PropTypes.func
    ]
  })
})
