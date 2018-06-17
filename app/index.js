import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import React from 'react'
import { ConnectedRouter } from 'react-router-redux'

import 'kea-saga'

import { store, history } from './store'
import App from './scenes/index'

import './index.html'

import bundles from './scenes/bundles'

const runAppInAdmin = () => {
  document.querySelector('#postdivrich').style.display = 'none'
}

if (window.wplfb && window.wplfb.active) {
  runAppInAdmin()
} else if (document.body.classList.contains('post-type-wplf-form')) {
  const bar = document.querySelector('#wp-content-editor-tools')
  const publishBtn = document.querySelector('#publish')
  const formbuilderBtn = publishBtn.cloneNode(true)

  formbuilderBtn.type = 'button'
  formbuilderBtn.value = 'Use formbuilder'
  formbuilderBtn.style.float = 'right'
  formbuilderBtn.style.transform = 'translateY(-5px)'
  bar.appendChild(formbuilderBtn)

  formbuilderBtn.addEventListener('click', runAppInAdmin)
}

function render () {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('wplfb_buildarea')
  )
}

// do we have to preload bundles before rendering?
if (typeof window !== 'undefined' && window.__keaPrerender) {
  Promise.all(window.__keaPrerender.map(chunk => bundles[chunk].loadComponent())).then(render).catch(render)
} else {
  render()
}
