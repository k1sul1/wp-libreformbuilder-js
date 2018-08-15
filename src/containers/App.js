import './App.scss'

import React, { Component } from 'react'
import { connect } from 'kea'
import builderLogic from '../logic/app-logic'
import Builder from '../components/builder/Builder'

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
  state = {
    contentEl: null,
    stateInput: null,
  }

  componentDidMount () {
    // Dirty DOM work
    const { modes } = this.props
    const publishButton = document.querySelector('#publish')

    if (publishButton) {
      console.log('Apparently in wp-admin')

      const stateInput = document.querySelector('[name="wplfb-state"]')
      const contentEl = document.querySelector('#content')

      this.actions.import(stateInput.value)
      this.setState({ contentEl, stateInput })

      publishButton.addEventListener('click', (e) => { // Not intending to remove
        console.log('I will not let you save')
        this.actions.setMode(modes.preview)
        this.actions.export({ stateInput, contentEl })
        e.preventDefault()
        e.stopPropagation()

        setTimeout(() => {
          // 1 second should be enough on all devices
          publishButton.click()
        }, 1000)
      }, { once: true, capture: true, passive: false })
    }
  }

  render () {
    const { contentEl, stateInput } = this.state
    const isWP = contentEl && stateInput

    return (
      <Builder isWP={isWP} />
    )
  }
}
