import React, { Component } from 'react';
import { VictoryLine, VictoryChart, VictoryTheme } from 'victory';

const LINE_CHART_STYLES = {
  data: { stroke: '#c43a31' },
  parent: { border: '1px solid #ccc' }
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

const getClicksByWeek = rawData => {
  // get clicks by week
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
      this.setState({ raw: results, clicksByWeek: getClicksByWeek(results) });
    });
  }

  state = {
    raw: [],
    clicksByWeek: []
  };

  render() {
    return (
      <VictoryChart theme={VictoryTheme.material}>
        <VictoryLine style={LINE_CHART_STYLES} data={this.state.clicksByWeek} />
      </VictoryChart>
    );
  }
}
