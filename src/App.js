import React, { Component } from 'react';
import './App.css';
import slug from 'unique-slug';

const ENDPOINTS = {
  addUrls: 'add-urls-aws',
  trackClick: 'track-click-aws'
};

const trackClick = async hash => {
  const response = await fetch(`/.netlify/functions/${ENDPOINTS.trackClick}`, {
    method: 'POST',
    body: JSON.stringify({ hash })
  });
  const url = response.json();
  return url;
};

const hash = window.location.pathname.replace('/', '');
if (hash) {
  trackClick(hash).then(({ url }) => {
    if (url) {
      window.location.href = url;
    } else {
      // todo: error message
    }
  });
}

const isCSV = str => str.startsWith('http');

const URL_REGEX = new RegExp(/(?:href=")(.+?)(?:")/g);

const replaceUrls = text => {
  const records = [];
  text = text.replace(URL_REGEX, (match, url) => {
    const hash = slug();
    records.push({
      url,
      hash
    });
    return match.replace(url, `${window.location.origin}/${hash}`);
  });
  return { text, records };
};

class URLMaker extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, msg: null, inputText: '', newUrls: [] };
  }

  callAddUrls = (api, data) => {
    this.setState({ loading: true });
    fetch(`/.netlify/functions/${api}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(response => {
        return response.json();
      })
      .then(json => {
        this.setState({ loading: false });
        if (json.results) {
          this.setState({ newUrls: json.results });
        }
      });
  };

  handleClickAddUrls = e => {
    e.preventDefault();
    const { inputText } = this.state;
    if (!inputText) {
      return;
    }
    let records = [];
    if (isCSV(inputText)) {
      // if it's a csv just split them all up
      const newUrls = inputText.split(/\s*,\s*/);
      newUrls.forEach(url =>
        records.push({
          url,
          hash: slug()
        })
      );
    } else {
      // otherwise it's a bunch of html where we need to replace all the urls with new ones
      const result = replaceUrls(inputText);
      records = result.records;
      this.setState({
        inputText: result.text
      });
    }
    this.callAddUrls(ENDPOINTS.addUrls, { records });
  };

  handleListChange = ({ target: { value } }) => {
    this.setState({
      inputText: value
    });
  };

  render() {
    const { loading, msg, newUrls } = this.state;

    return hash ? (
      <h1>Redirecting...</h1>
    ) : (
      <div className="wrapper">
        <form className="pure-form pure-form-stacked">
          <label htmlFor="inputText">
            <textarea
              className="urlInput"
              id="inputText"
              onChange={this.handleListChange}
              value={this.state.inputText}
            />Throw a csv list of urls or some html with proper hrefs here
          </label>
          <button className="pure-button pure-button-primary" onClick={this.handleClickAddUrls}>
            {loading ? 'Loading...' : 'Add Urls'}
          </button>
        </form>
        <span>{msg}</span>
        {newUrls && (
          <dl>
            {newUrls.map(({ url, hash }) => (
              <React.Fragment>
                <dd>{url}</dd>
                <dt>{`${window.location.origin}/${hash}`}</dt>
              </React.Fragment>
            ))}
          </dl>
        )}
      </div>
    );
  }
}

export default URLMaker;
