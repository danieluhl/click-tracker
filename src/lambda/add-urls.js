import Airtable from 'airtable';
import slug from 'unique-slug';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env.local`
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API }).base(process.env.AIRTABLE_APPID);
const urlsTable = base('urls');

const findRecordByToUrl = (records, toUrl) => records.find(record => record.get('to') === toUrl);

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'POST' || !event.body) {
      return { statusCode: 410, body: 'Unsupported Request Method' };
    }
    // body is an array of to - from objects
    const { newUrls } = JSON.parse(event.body);
    console.log(newUrls);
    if (!newUrls.length === 0) {
      return { statusCode: 400, body: 'Incomplete request' };
    }

    const tableRecords = await urlsTable.select({}).all();
    const results = [];
    newUrls.forEach(url => {
      const foundRecord = findRecordByToUrl(tableRecords, url);
      if (foundRecord) {
        console.log(`Record to url already exists: ${url};`);
      } else {
        const newRecord = {
          from: slug(),
          to: url
        };
        results.push(newRecord);
        urlsTable.create({ ...newRecord });
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ results })
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    };
  }
}
