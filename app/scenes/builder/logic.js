import { kea } from 'kea'
import { put } from 'redux-saga/effects'
import { merge } from 'lodash'
import shortid from 'shortid'
import PropTypes from 'prop-types'
import req from '../../utils/req'

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
  wrapper: {
    children: [],
    // Template is the container for the field, tag and attributes are
    // the actual values.
    template: `<div class="outer">
    <h1>Heading</h1>
    <div class="field-container">
    </div>
    <h2>Under container</h2>
    </div>`,
    label: false,
    tag: 'div',
    attributes: {
      'data-test': 'Test 2',
      className: 'child-container',
    }
  },
  text: {
    children: false,
    template: `<div class="field-container"></div>`,
    label: 'Text field label',
    tag: 'input',
    attributes: {
      type: 'text',
      placeholder: 'Test',
    }
  },
}
const defaultBuilderTree = {
  builder: {
    children: ['test1'],
  },
  test1: {
    field: 'wrapper',
    children: ['test2', 'test3'],
    template: `<div class="outer">
    <h1>Heading</h1>
    <div class="field-container">
    </div>
    <h2>Under container</h2>
    </div>`,
    label: false,
    tag: 'div',
    attributes: {
      className: 'child-container',
    }
  },
  test2: {
    field: 'text',
    children: false,
    template: `<div class="field-container"></div>`,
    label: 'Text field label',
    tag: 'input',
    attributes: {
      placeholder: 'Dog',
    }
  },
  test3: {
    field: 'text',
    children: false,
    label: 'Text field label',
    tag: 'input',
    attributes: {
      placeholder: 'Cat',
    }
  }
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

    setMode: (mode) => mode,
    addAvailableField: (key, data) => ({ [key]: data }),

    addField: (toFieldKey, toFieldIndex, fieldData) => ({
      to: toFieldKey,
      toIndex: toFieldIndex,
      data: fieldData,
    }),
    moveField: (startFieldKey, toFieldKey, toFieldIndex) => logReturn(({
      from: startFieldKey,
      to: toFieldKey,
      toIndex: toFieldIndex,
    })),
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

        const fieldObj = {
          [key]: {
            children: data.field.indexOf('child-container') !== -1 ? [] : false,
            tag,
            attributes,
            ...filtered,
          }
        }

        return ({ ...state, ...fieldObj })
      },
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
      yield put(actions.addAvailableField(...fields[i]))
    }

    // console.log(fields)
  },

  takeEvery: ({ actions, workers }) => ({
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
          contentEl.value = 'lol'
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
        key !== 'builder' && allChildren.indexOf(key) === -1
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
