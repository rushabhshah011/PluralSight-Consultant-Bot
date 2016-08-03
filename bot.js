'use strict';

const Wit = require('node-wit').Wit;
const FB = require('./facebook.js');
const Config = require('./const.js');
const https = require('https');
var res_body = "";

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

const actions = {
  say(sessionId, context, message, cb) {
    console.log(message);

    if (require.main === module) {
      cb();
      return;
    }

    const recipientId = context._fbid_;
    if (recipientId) {
      FB.fbMessage(recipientId, message, (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        cb();
      });
    } else {
      console.log('Oops! Couldn\'t find user in context:', context);
      cb();
    }
  },
  merge(sessionId, context, entities, message, cb) {
    // Retrieve the location entity and store it into a context field
    const pro = firstEntityValue(entities, 'profession');
	const sub = firstEntityValue(entities, 'subject');
console.log("profession"+pro);
console.log("Subject"+sub);	
if(sub == null && pro == null){
	context.missingSubPro = true ;
}
if(sub != null && pro == null){
	context.missingPro = sub ;
}
if(sub == null && pro != null){
	context.missingSub = true ;
}
if (sub != null && pro != null) {
  	context.pro = pro;
	context.sub = sub;
}

    cb(context);
  },
 error(sessionId, context, error) {
    console.log(error.message);
  },
   ['fetch-FBuname'](sessionId, context, cb) {
	https.get('https://graph.facebook.com/v2.6/'+context._fbid_+'?access_token=EAAENS5edtgwBALkc4d6beZAKSqjUlzHCZAuUf8jPQ5ZAvUQdwsbHL1GdlKpdLwzZCsfuUxnaZAZARwfRAnImDS5ZCjShSTPh74h0vQApuVZBIAt4BXHONxV7lLm03sJeMTpvpfjvDYEw8ZCsCucscOihQGWJsfOX1VcStTOivftXcpwZDZD', (res) => {
 	res.on('data', function (chunk) {
 		res_body = JSON.parse(chunk);
		context.FBuname = res_body.first_name;
		cb(context);
 	});
 }).on('error', (e) => {
   console.log(`Got error: ${e.message}`);
    //   const loc = firstEntityValue(entities, 'location');

   cb();
 });
 },
 ['Send-Options'](sessionId, context, cb) {
	  const recipientId = context._fbid_;
 FB.fbSendButtons(recipientId,"What are you looking for?", (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

     });
		cb(context);

	 },
   ['fetch-data'](sessionId, context, cb) {
	https.get('https://sp10050dad.guided.ss-omtrdc.net/?callback=jQuery111009308100848311767_1470245204573&page=1&m_Sort=&q=*&x10=categories&q10=course&x11=roles&q11=software-development%7C&x12=subjects&q12=android&m_Count=25&_=1470245204574', (res) => {
 	res.on('data', function (chunk) {
 		res_body = JSON.parse(chunk);
     console.log(res_body.resultsets);
		cb(context);
 	});
 }).on('error', (e) => {
   console.log(`Got error: ${e.message}`);
    //   const loc = firstEntityValue(entities, 'location');

   cb();
 });
 },

};


const getWit = () => {
  return new Wit(Config.WIT_TOKEN, actions);
};

exports.getWit = getWit;

// http://stackoverflow.com/questions/6398196
if (require.main === module) {
  console.log("Bot testing mode.");
  const client = getWit();
  client.interactive();
}