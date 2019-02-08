import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env`
});

if (!process.env.AIRTABLE_API || !process.env.AIRTABLE_APPID) {
  throw new Error('Missing airtable environment variables (.env file): AIRTABLE_API, AIRTABLE_APPID');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API }).base(process.env.AIRTABLE_APPID);
const urlsTable = base('urls');

const findRecordByToUrl = (records, toUrl) => records.find(record => record.get('to') === toUrl);

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'POST' || !event.body) {
      return { statusCode: 410, body: 'Unsupported Request Method' };
    }
    // body is an array of to - from objects
    const { records } = JSON.parse(event.body);
    if (!records.length === 0) {
      return { statusCode: 400, body: 'Incomplete request' };
    }

    const tableRecords = await urlsTable.select({}).all();
    const { newRecords, promises } = records.reduce(
      ({ promises, newRecords }, { from, to }) => {
        const foundRecord = findRecordByToUrl(tableRecords, from);
        if (foundRecord) {
          console.log(`Record to url already exists: ${from};`);
        }

        const newRecord = {
          from,
          to,
          count: 0
        };
        return {
          newRecords: [...newRecords, newRecord],
          promises: [...promises, urlsTable.create({ ...newRecord })]
        };
      },
      { newRecords: [], promises: [] }
    );

    // gotta wait to take care of business before moving on
    await Promise.all(promises);

    return {
      statusCode: 200,
      body: JSON.stringify({ results: [...newRecords] })
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    };
  }
}
