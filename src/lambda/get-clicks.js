import dotenv from 'dotenv';
import dynamoose from 'dynamoose';
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

dynamoose.AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID_LOCAL,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_LOCAL,
  region: 'us-east-1'
});

const UrlsTable = dynamoose.model('urls', {
  hash: String,
  url: String,
  date: String
});

const ClicksTable = dynamoose.model('clicks', {
  id: String,
  date: String,
  hash: String
});

export const handler = makeSafeAsyncLambdaHandler(async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 410, body: JSON.stringify({ msg: 'Unsupported Request Method' }) };
  }

  // get all rows from the dynamo db
  const allUrls = await UrlsTable.scan().exec();
  console.log({ allUrls });
  const allClicks = await ClicksTable.scan().exec();
  console.log({ allClicks });

  const urlsHash = allUrls.reduce((acc, { url, date, hash }) => {
    return { ...acc, [hash]: url };
  }, {});
  // build an array sorted by date
  const results = allClicks.reduce((acc, { hash, date }) => {
    return [...acc, { hash, url: urlsHash[hash], date }];
  }, []);
  console.log({ results });

  return {
    statusCode: 200,
    body: JSON.stringify({ results })
  };
});
