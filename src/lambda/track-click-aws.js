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

export const handler = makeSafeAsyncLambdaHandler(async (event, context) => {
  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 410, body: JSON.stringify({ msg: 'Unsupported Request Method' }) };
  }
  const record = JSON.parse(event.body);
  if (!record.hash) {
    return { statusCode: 400, body: JSON.stringify({ msg: `Record missing hash: ${record}` }) };
  }

  const { hash } = record;

  const getResult = await UrlsTable.get({ hash });
  if (!getResult) {
    throw new Error(`hash ${hash} not found in the database`);
  }

  const now = Date.now().toString();
  const click = new ClicksTable({ hash, date: now, id: slug() });
  const insertResult = await click.save();

  if (Object.keys(insertResult.UnprocessedItems).length > 0) {
    throw new Error(`There was an issue with the put for items ${JSON.stringify(hash)}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ url: getResult.url })
  };
});
