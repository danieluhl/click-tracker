import React, { Component, Fragment } from 'react';
import { VictoryLabel, VictoryAxis, VictoryPortal, VictoryLine, VictoryChart, VictoryTheme, VictoryBar } from 'victory';

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
      const foundEntry = acc.find(entry => entry.x === next[key]);
      if (foundEntry) {
        foundEntry.y++;
      } else {
        acc = [...acc, { x: next[key], y: 1 }];
      }
      return acc;
    }, [])
    .sort((a, b) => {
      return a.y - b.y;
    });
};

const getClicksByWeek = rawData => {
  return rawData
    .sort(({ date: d1 }, { date: d2 }) => parseInt(d1, 10) - parseInt(d2, 10))
    .reduce((acc, { hash, date }) => {
      const week = getWeekNumber(parseInt(date, 10));
      const foundEntry = acc.find(entry => entry.x === week);
      if (foundEntry) {
        foundEntry.y++;
      } else {
        acc = [...acc, { x: week, y: 1 }];
      }
      return acc;
    }, []);
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
      const dataByUrls = getDataByKey(results, 'url');
      const urls = dataByUrls.map(item => item.x);
      console.log(urls);
      this.setState({
        raw: results,
        clicksByWeek: getClicksByWeek(results),
        clicksByUrl: dataByUrls,
        clicksByUrlLabels: urls
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
      <Fragment>
        <div style={{ width: '50%' }}>
          <VictoryChart theme={VictoryTheme.material}>
            <VictoryLine style={LINE_CHART_STYLES} data={this.state.clicksByWeek} />
          </VictoryChart>
        </div>
        <div style={{ width: '100%' }}>
          <VictoryChart theme={VictoryTheme.material}>
            <VictoryBar horizontal={true} textAnchor="middle" style={BAR_CHART_STYLES} data={this.state.clicksByUrl} />
          </VictoryChart>
        </div>
      </Fragment>
    );
  }
}

// labelComponent = {< VictoryLabel verticalAnchor = "middle" textAnchor = "end" lineHeight = "10px" />}
