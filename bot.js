'use strict';

// Weather Example
// See https://wit.ai/sungkim/weather/stories and https://wit.ai/docs/quickstart
const Wit = require('node-wit').Wit;
const FB = require('./facebook.js');
const Config = require('./const.js');
const https = require('https');
var res_body;

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

// Bot actions
const actions = {
  say(sessionId, context, message, cb) {
    console.log(message);

    // Bot testing mode, run cb() and return
    if (require.main === module) {
      cb();
      return;
    }

    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to from context
    // TODO: need to get Facebook user name
    const recipientId = context._fbid_;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      FB.fbMessage(recipientId, message, (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        // Let's give the wheel back to our bot
        cb();
      });
    } else {
      console.log('Oops! Couldn\'t find user in context:', context);
      // Giving the wheel back to our bot
      cb();
    }
  },
  merge(sessionId, context, entities, message, cb) {
    // Retrieve the location entity and store it into a context field
    const loc = firstEntityValue(entities, 'location');
    if (loc) {
      context.loc = loc; // store it in context
    }

    cb(context);
  },

  error(sessionId, context, error) {
    console.log(error.message);
  },
  ['fetch-fbuname'](sessionId, context, cb) {
	  https.get('https://graph.facebook.com/v2.6/933900786739383?access_token=EAAENS5edtgwBALkc4d6beZAKSqjUlzHCZAuUf8jPQ5ZAvUQdwsbHL1GdlKpdLwzZCsfuUxnaZAZARwfRAnImDS5ZCjShSTPh74h0vQApuVZBIAt4BXHONxV7lLm03sJeMTpvpfjvDYEw8ZCsCucscOihQGWJsfOX1VcStTOivftXcpwZDZD', (res) => {
	res.on('data', function (chunk) {
		res_body = JSON.parse(chunk);
		FB.fbSendButtons(recipientId, "Hello "+res_body.first_name+"! I am Pluralsight Consultant Bot. What are you looking for?", (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        // Let's give the wheel back to our bot
        cb();
      });
	});
  // consume response body

}).on('error', (e) => {
  console.log(`Got error: ${e.message}`);
});
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.loc)
    
    
  },

  // fetch-weather bot executes
  ['fetch-weather'](sessionId, context, cb) {
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.loc)
    context.forecast = 'sunny';
    cb(context);
  },
};


const getWit = () => {
  return new Wit(Config.WIT_TOKEN, actions);
};

exports.getWit = getWit;

// bot testing mode
// http://stackoverflow.com/questions/6398196
if (require.main === module) {
  console.log("Bot testing mode.");
  const client = getWit();
  client.interactive();
}