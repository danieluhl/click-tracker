import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import slug from 'unique-slug';

dotenv.config({
  path: `.env`
});

if (!process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('Missing aws environment variables (.env file): AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID');
}

// set the region
AWS.config.update({ region: 'us-east-1' });
// get database
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
const CLICKS_TABLE = 'clicks';
const URLS_TABLE = 'urls';

const buildRequestParams = (hash, date) => ({
  RequestItems: {
    [CLICKS_TABLE]: [
      {
        PutRequest: {
          Item: {
            id: { S: slug() },
            hash: { S: hash },
            date: { S: date }
          }
        }
      }
    ]
  }
});

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'POST' || !event.body) {
      return { statusCode: 410, body: 'Unsupported Request Method' };
    }
    const record = JSON.parse(event.body);
    if (!record.hash) {
      return { statusCode: 400, body: 'Incomplete request' };
    }

    const { hash } = record;

    // grab all the records from the urls table
    // check if we already have a record for this hash
    // if we have it, use the to url and insert a click row, if not throw an error

    // GET ITEM
    var params = {
      TableName: URLS_TABLE,
      Key: {
        hash: { S: hash }
      }
    };

    // Call DynamoDB to read the item from the table
    const getResult = await ddb.getItem(params).promise();
    const hasResult = !!getResult.Item;
    if (!hasResult) {
      throw new Error(`hash ${hash} not found in the database`);
    }
    const url = getResult.Item.url.S;
    // INSERT ITEM
    const now = Date.now().toString();
    const insertParams = buildRequestParams(hash, now);

    // Call DynamoDB to add the item to the table
    const insertResult = await ddb.batchWriteItem(insertParams).promise();
    console.log({ insertResult });
    return {
      statusCode: 200,
      body: JSON.stringify({ url })
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    };
  }
}
