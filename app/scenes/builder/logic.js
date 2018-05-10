import { kea } from 'kea'
import { put } from 'redux-saga/effects'
import { merge } from 'lodash'
import shortid from 'shortid'
import PropTypes from 'prop-types'

const logReturn = x => console.log(x) || x
const objectFromArray = (obj, [k, v]) => ({ ...obj, [k]: v })
const defaultFields = {
  wrapper: {
    children: [],
    tag: 'div',
    attributes: {
      'data-test': 'Test 2',
    }
  },
  text: {
    children: false,
    tag: 'input',
    attributes: {
      type: 'text',
      placeholder: 'Test',
    }
  }
}
const defaultBuilderTree = {
  builder: {
    children: ['test1'],
  },
  test1: {
    field: 'wrapper',
    children: ['test2', 'test3'],
    tag: 'div',
  },
  test2: {
    field: 'text',
    children: false,
    tag: 'input',
    attributes: {
      placeholder: 'Dog',
    }
  },
  test3: {
    field: 'text',
    children: false,
    tag: 'input',
    attributes: {
      placeholder: 'Cat',
    }
  }
}

export default kea({
  path: () => ['scenes', 'builder'],

  constants: () => [
  ],

  actions: ({ constants }) => ({
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
    fields: [defaultFields, PropTypes.object, {}, {
      [actions.addAvailableField]: (state, payload) => ({ ...state, ...payload }),
    }],

    builderTree: [defaultBuilderTree, PropTypes.object, {}, {
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

  takeEvery: ({ actions, workers }) => ({
    /**
     * Delete every field which isn't anywhere
     */
    [actions.deleteField]: function * (params) {
      const entries = Object.entries(yield this.get('builderTree'))
      const allChildren = entries
        .filter(([key, { children }]) => children !== false)
        .reduce((acc, [key, { children }]) => [...acc, children], [])
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
    getPopulatedField: [
      () => [selectors.fields],
      (field) => {
        return (key, overwriteWith) => merge(field[key], { id: shortid.generate() }, overwriteWith)
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
