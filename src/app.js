import React from 'react'
import { render } from 'react-dom'
import { Router, Route, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'

import RootPage from './pages/root'

const history = createBrowserHistory()

const App = () => {
  return (
    <section className='section'>
      <div className='container'>
        <Router history={history}>
          <Switch>
            <Route path='/' component={RootPage} exact />
          </Switch>
        </Router>
      </div>
    </section>
  )
}

render(<App />, document.querySelector('#content'))
