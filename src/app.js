import React from 'react'
import { render } from 'react-dom'
import { Router, Route, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'

import RootPage from './pages/root'

const history = createBrowserHistory()

const App = () => {
  return (
    <div>
      <section className='hero is-success'>
        <div className='hero-body'>
          <div className='container'>
            <h1 className='title'>Qiita Tag Visualization</h1>
          </div>
        </div>
      </section>
      <section className='section'>
        <div className='container'>
          <Router history={history}>
            <Switch>
              <Route path='/' component={RootPage} exact />
            </Switch>
          </Router>
        </div>
      </section>
      <footer className='footer'>
        <div className='content has-text-centered'>
          <p>&copy; 2019 Yosuke Onoue</p>
          <p>
            <a href='https://vdslab.jp/'>vdslab.jp</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

render(<App />, document.querySelector('#content'))
