import './styles.scss'

import React from 'react'
import { Route } from 'react-router'

import bundles from './bundles'

export default () => (
  <div>
    <Route exact path='/' component={bundles.builder} />
  </div>
)
