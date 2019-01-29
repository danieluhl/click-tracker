import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env.local`
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API }).base(process.env.AIRTABLE_APPID);
const urlsTable = base('urls');

const findRecord = (records, fromUrl) => records.find(record => record.get('from') === fromUrl);

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'POST' || !event.body) {
      return { statusCode: 410, body: 'Unsupported Request Method' };
    }
    const record = JSON.parse(event.body);
    if (!record.fromUrl) {
      return { statusCode: 400, body: 'Incomplete request' };
    }
    const { fromUrl } = record;
    let { toUrl } = record;
    const records = await urlsTable.select({}).all();
    const foundRecord = findRecord(records, fromUrl);
    if (foundRecord) {
      // increment
      urlsTable.update(foundRecord.getId(), {
        count: foundRecord.get('count') + 1
      });
      toUrl = foundRecord.get('to');
    } else {
      // add record
      urlsTable.create({
        from: fromUrl,
        to: toUrl
      });
    }
    console.log(foundRecord);
    return {
      statusCode: 200,
      body: JSON.stringify({ toUrl })
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    };
  }
}
