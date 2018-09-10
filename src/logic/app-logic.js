import { kea } from 'kea'
import { put } from 'redux-saga/effects'
import { merge } from 'lodash'
import pretty from 'pretty'
import shortid from 'shortid'
import PropTypes from 'prop-types'
import req from '../utils/req'

const getFieldTagNameAndAttributes = (html) => {
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

const objectFromArray = (obj, [k, v]) => ({ ...obj, [k]: v })
const defaultFields = {} // No defaults shipped with the app, provide from demo if necessary
const defaultBuilderTree = {
  Root: {
    children: [],
  },
}

const MODE_PREVIEW = 0
const MODE_EDIT = 1
const MODE_MOVE_ANYWHERE = 2


const builderModes = {
  available: {
    edit: {
      name: 'Edit',
      submode: false,
      id: MODE_EDIT,
    },
    moveAnywhere: {
      name: 'Move anywhere',
      submode: MODE_EDIT,
      id: MODE_MOVE_ANYWHERE,
    },
    preview: {
      name: 'Preview',
      submode: false,
      id: MODE_PREVIEW,
    },
  },
  enabled: MODE_EDIT,
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
      [actions.setMode]: (state, payload) => ({ ...state, enabled: payload.id }),
    }],
    fields: [defaultFields, PropTypes.object, {}, {
      [actions.addAvailableField]: (state, payload) => {
        const [key, data] = Object.entries(payload)[0]
        const { field, ...filtered } = data
        const [tag, attributes] = getFieldTagNameAndAttributes(field)

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
      [actions.setHTML]: (state, payload) => pretty(payload),
    }],

    builderTree: [defaultBuilderTree, PropTypes.object, { persist: true }, {
      [actions.addField]: (state, payload) => {
        const { to, toIndex, data } = payload
        const { id, ...rest } = data // Use populatedField selector to populate `rest`

        if (!state[to]) {
          throw new Error(`Attempted to add a new field to a nonexistent parent ${to}`)
        }

        if (rest.children && rest.children.length !== 0) {
          throw new Error(`Field can't contain children on creation!`)
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

        return entries
          .map(([key, data]) => {
            const { children } = data
            const posInChildren = Array.isArray(children) ? children.indexOf(fieldKey) : -1

            if (posInChildren > -1) {
              children.splice(posInChildren, 1)
            }

            return [key, data]
          })
          .filter(([key, data]) => key !== fieldKey)
          .reduce(objectFromArray, {})
      },
    }],
  }),

  start: function * () {
    const actions = this.actions

    try {
      const fieldReq = yield req.get('/wplfb/fields')
      const { data } = fieldReq
      const fields = Object.entries(data.fields)

      for (let i = 0; i < fields.length; i++) {
        const [index, data] = fields[i]

        yield put(actions.addAvailableField(index, data))
      }
    } catch (e) {
      console.error('Unable to get fields, running with demo', e)

      const demoFields = [
        [
          "U0",
          {
            "name": "Range input",
            "field": "<input type=\"range\" name=\"rangeslider\" min=\"1\" max=\"5\" step=\"1\" value=\"3\" >",
            "template": "<div class=\"wplfb-input\">\r\n  <div class=\"wplfb-field-container\"></div>\r\n  <div class=\"scale\" style=\"overflow: hidden;\">\r\n    <span class=\"lower\" style=\"float: left;\">Worse</span>\r\n    <span class=\"higher\" style=\"float: right;\">Better</span>\r\n  </div>\r\n</div>",
            "label": "How did we do?"
          }
        ],
        [
          "C0",
          {
            "name": "Wrapper",
            "field": "<div class=\"wplfb-wrapper\" id=\"wrapper_#\"><div class=\"wplfb-child-container\"></div></div>",
            "template": null,
            "label": null
          }
        ],
        [
          "C1",
          {
            "name": "Text",
            "field": "<input type=\"text\" required name=\"textinput\" class=\"\" placeholder=\"Name\"\n          wplfbAttributes='{ \"type\": { \"hidden\": true } }'>",
            "template": "<div class=\"wplfb-input\"><div class=\"wplfb-field-container\"></div></div>",
            "label": "Default label"
          }
        ],
        [
          "C2",
          {
            "name": "Email",
            "field": "<input type=\"email\" required name=\"email\" class=\"\" placeholder=\"someone@example.com\"\n          wplfbAttributes='{ \"type\": { \"hidden\": true } }'>",
            "template": "<div class=\"wplfb-input\"><div class=\"wplfb-field-container\"></div></div>",
            "label": "Enter your email address"
          }
        ],
        [
          "C3",
          {
            "name": "Password",
            "field": "<input type=\"password\" required name=\"password\" class=\"\" placeholder=\"hunter2\"\n          wplfbAttributes='{ \"type\": { \"hidden\": true } }'>",
            "template": "<div class=\"wplfb-input\"><div class=\"wplfb-field-container\"></div></div>",
            "label": "Enter your password"
          }
        ],
        [
          "C4",
          {
            "name": "Submit",
            "field": "<input type=\"submit\" class=\"\" value=\"Submit\">",
            "template": null,
            "label": null
          }
        ]
      ]

      const fields = demoFields

      for (let i = 0; i < fields.length; i++) {
        const [index, data] = fields[i]

        yield put(actions.addAvailableField(index, data))
      }
    }
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
      } catch (e) {
        console.log('No valid payload provided, skipping import')
        console.error(e)
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

        if (stateInput && contentEl) {
          stateInput.value = JSON.stringify(exportObj)
          contentEl.value = state.previewHTML
        }
      } catch (e) {
        console.log('Something went wrong exporting')
        console.error(e)
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
    mode: [
      () => [selectors.mode],
      ({ enabled, available }) => Object.values(available).find(mode => mode.id === enabled),
      // ({ enabled, available }) => Object.values(available).find(mode => mode.id === enabled),
      PropTypes.object
    ],
    getPopulatedField: [
      () => [selectors.fields],
      (fields) => {
        return (key, overwriteWith) => merge(
          {}, // Mutates first param
          fields[key],
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
