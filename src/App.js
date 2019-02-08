import React, { Component } from 'react';
import './App.css';
import slug from 'unique-slug';

const ENDPOINTS = {
  addUrls: 'add-urls',
  trackClick: 'track-click'
};

const trackClick = async hash => {
  const response = await fetch(`/.netlify/functions/${ENDPOINTS.trackClick}`, {
    method: 'POST',
    body: JSON.stringify({ hash: hash })
  });
  const url = response.json();
  return url;
};

const hash = window.location.pathname.replace('/', '');
if (hash) {
  trackClick(hash).then(({ toUrl }) => {
    if (toUrl) {
      window.location.href = toUrl;
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
    const from = slug();
    records.push({
      to: url,
      from
    });
    return match.replace(url, `${window.location.origin}/${from}`);
  });
  return { text, records };
};

class URLMaker extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, msg: null, inputText: '', newUrls: [] };
  }

  createHandleClick = (api, data) => e => {
    e.preventDefault();

    this.setState({ loading: true });
    fetch(`/.netlify/functions/${api}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(response => {
        return response.json();
      })
      .then(json => {
        console.log(json.results);
        this.setState({ loading: false, newUrls: json.results });
      });
  };

  handleClickAddUrls = e => {
    const { inputText } = this.state;
    let records = [];
    if (isCSV(inputText)) {
      // if it's a csv just split them all up
      const newUrls = inputText.split(/\s*,\s*/);
      newUrls.forEach(url =>
        records.push({
          to: url,
          from: slug()
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
    this.createHandleClick(ENDPOINTS.addUrls, { records })(e);
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
            {newUrls.map(({ to, from }) => (
              <React.Fragment>
                <dd>{to}</dd>
                <dt>{`${window.location.origin}/${from}`}</dt>
              </React.Fragment>
            ))}
          </dl>
        )}
      </div>
    );
  }
}

export default URLMaker;
