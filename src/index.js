import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import React from 'react'
import { ConnectedRouter } from 'react-router-redux'
import * as serviceWorker from './serviceWorker'
import WP from './utils/WP'

import 'kea-saga'

import { store, history } from './store'
import App from './containers/App'

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

const runAppInAdmin = () => {
  document.querySelector('#postdivrich').style.display = 'none'
  document.querySelector('[name="wplfb-enabled"]').value = '1'
  document.querySelector('#wplfb_form_metabox').style.display = 'block'

  main()
}

if (WP.isAdmin()) {
  const isFormPage = document.body.classList.contains('post-type-wplf-form')
  const isFieldPage = document.body.classList.contains('post-type-wplfb-field')

  if (isFormPage) {
    if (WP.active()) {
      runAppInAdmin()
    } else {
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
  } else if (isFieldPage) {
    // The standard content field breaks UI flow, remove it
    const content = document.getElementById('content')

    content.parentNode.removeChild(content)
  }
} else {
  main()
}
