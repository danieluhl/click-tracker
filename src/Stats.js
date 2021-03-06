import React, { Component, Fragment } from 'react';
import { BarChart, LineChart } from 'reaviz';

const LINE_CHART_STYLES = {
  data: { stroke: '#c43a31' },
  parent: { border: '1px solid #ccc' }
};
const BAR_CHART_STYLES = {
  labels: { fontSize: '10px' }
};

const getAllClicksData = async () => {
  const response = await fetch(`/.netlify/functions/get-clicks`, {
    method: 'POST'
  });
  const result = response.json();
  return result;
};

const getWeekNumber = timestamp => {
  var d = new Date(timestamp);
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const getDataByKey = (rawData, key) => {
  return rawData
    .reduce((acc, next) => {
      const foundEntry = acc.find(entry => entry.key === next[key]);
      if (foundEntry) {
        foundEntry.data++;
      } else {
        acc = [...acc, { key: next[key], data: 1 }];
      }
      return acc;
    }, [])
    .sort((a, b) => {
      return a.data - b.data;
    });
};

const getClicksByWeek = rawData => {
  return rawData
    .sort(({ date: d1 }, { date: d2 }) => parseInt(d1, 10) - parseInt(d2, 10))
    .reduce((acc, { hash, date }) => {
      const week = getWeekNumber(parseInt(date, 10));
      const foundEntry = acc.find(entry => entry.key === week);
      if (foundEntry) {
        foundEntry.data++;
      } else {
        acc = [...acc, { key: week, data: 1 }];
      }
      return acc;
    }, []);
};

const getClicksByUrlForWeek = rawData => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekTimestamp = lastWeek.getTime();
  const lastWeekClicks = rawData.filter(({ date }) => {
    return parseInt(date) > lastWeekTimestamp;
  });
  return getDataByKey(lastWeekClicks, 'url');
};

export default class Stats extends Component {
  componentWillMount() {
    // grab the data
    getAllClicksData().then(result => {
      const { results } = result;
      if (!results) {
        console.log(`no results, response: `, result);
        return;
      }
      this.setState({
        raw: results,
        clicksByWeek: getClicksByWeek(results),
        clicksByUrl: getDataByKey(results, 'url'),
        clicksByUrlForWeek: getClicksByUrlForWeek(results)
      });
    });
  }

  state = {
    raw: [],
    clicksByWeek: [],
    clicksByUrl: []
  };

  render() {
    return (
      <div style={{ margin: '0 auto', width: '80vw', padding: '0 0 200px 0' }}>
        <h2>Clicks by week</h2>
        <div style={{ height: '40vh' }}>
          <LineChart data={this.state.clicksByWeek} />
        </div>
        <h2>Last weeks clicks by url</h2>
        <div style={{ height: '20vh' }}>
          <BarChart data={this.state.clicksByUrlForWeek} />
        </div>
        <h2>All time clicks by url</h2>
        <div style={{ height: '20vh' }}>
          <BarChart data={this.state.clicksByUrl} />
        </div>
      </div>
    );
  }
}

// labelComponent = {< VictoryLabel verticalAnchor = "middle" textAnchor = "end" lineHeight = "10px" />}
