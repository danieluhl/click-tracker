import AWS from 'aws-sdk';
import dotenv from 'dotenv';

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
    const now = Date.now().toString();

    const params = buildRequestParams(records, now);

    // Call DynamoDB to add the item to the table
    const result = await ddb.batchWriteItem(params, (err, data) => {
      if (err) {
        throw new Error(`AWS error: ${err}`);
      } else {
        console.log('Success', data);
      }
    });

    console.log({ result });

    return {
      statusCode: 200,
      body: JSON.stringify({ results: [] })
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    };
  }
}
