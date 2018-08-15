import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import React from 'react'
import { ConnectedRouter } from 'react-router-redux'
import * as serviceWorker from './serviceWorker'

import 'kea-saga'

import { store, history } from './store'
import App from './containers/App'

const runAppInAdmin = () => {
  document.querySelector('#postdivrich').style.display = 'none'
}

if (window.wplfb && window.wplfb.active) {
  runAppInAdmin()
} else if (document.body.classList.contains('post-type-wplf-form')) {
  const bar = document.querySelector('#wp-content-editor-tools')
  const publishBtn = document.querySelector('#publish')
  const formbuilderBtn = publishBtn.cloneNode(true)

  formbuilderBtn.id = null
  formbuilderBtn.type = 'button'
  formbuilderBtn.value = 'Use formbuilder'
  formbuilderBtn.style.float = 'right'
  formbuilderBtn.style.transform = 'translateY(-5px)'
  bar.appendChild(formbuilderBtn)

  formbuilderBtn.addEventListener('click', runAppInAdmin)
}

function main () {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('wplfb_buildarea')
  )

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: http://bit.ly/CRA-PWA
  serviceWorker.unregister()
}

main()
