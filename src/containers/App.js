import './App.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'kea'
import builderLogic from '../logic/app-logic'
import Builder from '../components/builder/Builder'
import WP from '../utils/WP'

@connect({
  actions: [
    builderLogic, [
      'export',
      'import',
      'setMode',
    ]
  ],
  props: [
    builderLogic, [
      'modes',
    ]
  ],
})
export default class App extends Component {
  static propTypes = {
    modes: PropTypes.object.isRequired,
  }

  state = {
    contentEl: null,
    stateInput: null,
  }

  componentDidMount () {
    // Dirty DOM work
    const { modes } = this.props

    if (WP.isAdmin()) {
      const publishButton = document.querySelector('#publish')
      const contentEl = document.querySelector('#content')
      const stateInput = WP.stateInput()

      const state = WP.state()

      if (state) {
        const quotesRemoved = state.slice(1).slice(0, state.length - 2)
        this.actions.import(quotesRemoved)
      }

      this.setState({ contentEl, stateInput })

      // Add an event listener on top of publish button, that fires only once.
      // Will not work on anything old.
      publishButton.addEventListener('click', (e) => {
        this.actions.setMode(modes.preview)
        this.actions.export({ stateInput, contentEl })
        e.preventDefault()
        e.stopPropagation()

        // After everything is done, trigger the publish button
        // TODO: Implement a promise to check when the job is actually done
        setTimeout(() => {
          publishButton.click()
        }, 2000)
      }, { once: true, capture: true, passive: false })
    }
  }

  render () {
    return (
      <Builder />
    )
  }
}
