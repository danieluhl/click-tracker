import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const ENDPOINTS = {
  addUrls: 'add-urls',
  trackClick: 'track-click'
};
class LambdaDemo extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, msg: null };
  }

  createHandleClick = (api, data) => e => {
    e.preventDefault();

    this.setState({ loading: true });
    fetch(`/.netlify/functions/${api}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(response => {
        console.log(response);
        return response.json();
      })
      .then(json => this.setState({ loading: false, msg: json.toUrl }));
  };

  createHandleClickAddUrls = () => {
    const data = {
      newUrls: ['https://test.com', 'https://app.netlify.com/', 'https://github.com', 'https://mail.google.com']
    };
    return this.createHandleClick(ENDPOINTS.addUrls, data);
  };

  render() {
    const { loading, msg } = this.state;

    return (
      <p>
        <button
          onClick={this.createHandleClick(ENDPOINTS.trackClick, { fromUrl: 'bingo', toUrl: 'https://wayfair.com' })}
        >
          {loading ? 'Loading...' : 'Track Click'}
        </button>
        <button onClick={this.createHandleClickAddUrls()}>{loading ? 'Loading...' : 'Add Urls'}</button>
        <br />
        <span>{msg}</span>
      </p>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <LambdaDemo />
        </header>
      </div>
    );
  }
}

export default App;
