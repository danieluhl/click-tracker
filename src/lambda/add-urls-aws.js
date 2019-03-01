import dotenv from 'dotenv';
import dynamoose from 'dynamoose';
import slug from 'unique-slug';
// this lets us use async await without try catch in a lambda
import makeSafeAsyncLambdaHandler from '../async-lambda-handler-maker';

dotenv.config({
  path: `.env`
});

if (!process.env.AWS_SECRET_ACCESS_KEY_LOCAL || !process.env.AWS_ACCESS_KEY_ID_LOCAL) {
  throw new Error(
    'Missing aws environment variables (.env file): AWS_SECRET_ACCESS_KEY_LOCAL, AWS_ACCESS_KEY_ID_LOCAL'
  );
}

const URLS_TABLE = 'urls';

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

export const handler = makeSafeAsyncLambdaHandler(async function(event, context) {
  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 410, body: JSON.stringify({ msg: 'Unsupported Request Method' }) };
  }
  // body is an array of objects with url property
  const { records } = JSON.parse(event.body);
  if (!records.length === 0) {
    return { statusCode: 400, body: 'Incomplete request' };
  }
  const now = Date.now().toString();

  // get all rows from the dynamo db
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
