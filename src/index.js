import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Stats from './Stats';
import * as serviceWorker from './serviceWorker';
import pure from 'purecss';
import { Route, Link, BrowserRouter as Router, Switch } from 'react-router-dom';

class Notfound extends Component {
  render() {
    return <div>Page Not Found</div>;
  }
}

class Redirect extends Component {
  render() {
    return <App />;
  }
}

class Page extends Component {
  render() {
    return (
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/stats">Stats</Link>
          </li>
        </ul>
        <Switch>
          <Route path="/stats" component={Stats} />
          <Route path="/" component={App} />
          <Route component={Notfound} />
        </Switch>
      </div>
    );
  }
}

const routing = (
  <Router>
    <div>
      <Switch>
        <Route path="/stats" component={Page} />
        <Route path="/" component={Page} />
        <Route path="/:hash" component={Redirect} />
        <Route component={Page} />
      </Switch>
    </div>
  </Router>
);

ReactDOM.render(routing, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();
