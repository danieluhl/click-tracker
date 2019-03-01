import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import dynamoose from 'dynamoose';
import slug from 'unique-slug';
import makeHandler from '../async-lambda-handler-maker';

dotenv.config({
  path: `.env`
});

if (!process.env.AWS_SECRET_ACCESS_KEY_LOCAL || !process.env.AWS_ACCESS_KEY_ID_LOCAL) {
  throw new Error(
    'Missing aws environment variables (.env file): AWS_SECRET_ACCESS_KEY_LOCAL, AWS_ACCESS_KEY_ID_LOCAL'
  );
}

// set the region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID_LOCAL,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_LOCAL,
  region: 'us-east-1'
});
// get database
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
const URLS_TABLE = 'urls';

const buildRequestParams = (records, date) => ({
  RequestItems: {
    [URLS_TABLE]: records.map(({ hash, url }) => ({
      PutRequest: {
        Item: {
          hash: { S: hash },
          url: { S: url },
          date: { S: date }
        }
      }
    }))
  }
});

// DYNAMOOSE
dynamoose.AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID_LOCAL,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_LOCAL,
  region: 'us-east-1'
});

const UrlsTable = dynamoose.model(URLS_TABLE, {
  hash: String,
  url: String,
  date: String
});

export const handler = makeHandler(async function(event, context) {
  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 410, body: JSON.stringify({ msg: 'Unsupported Request Method' }) };
  }
  // body is an array of to - from objects
  const { records } = JSON.parse(event.body);
  if (!records.length === 0) {
    return { statusCode: 400, body: 'Incomplete request' };
  }
  const now = Date.now().toString();

  const allRows = await UrlsTable.scan().exec();

  // filter out any existing urls
  const recordsToSave = records
    .filter(record => (allRows.count > 0 ? allRows.find(({ url }) => url !== record.url) : true))
    .map(item => ({
      ...item,
      date: now,
      hash: slug()
    }));

  const result = await UrlsTable.batchPut(recordsToSave);

  if (Object.keys(result.UnprocessedItems).length > 0) {
    throw new Error(`There was an issue with the batchPut for items: ${JSON.stringify(recordsToSave)}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results: recordsToSave })
  };
});
