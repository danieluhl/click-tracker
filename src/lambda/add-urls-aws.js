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

const insertItems = (db, params) => {
  return new Promise((res, rej) => {
    db.batchWriteItem(params, (err, data) => {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success', data);
      }
    });
  });
};

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

    // const params = buildRequestParams(records, now);
    const { hash, url } = records[0];
    const params = {
      TableName: URLS_TABLE,
      Item: {
        hash: { S: hash },
        url: { S: url },
        date: { S: now }
      }
    };

    // Call DynamoDB to add the item to the table
    const result = await ddb.putItem(params).promise();

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
