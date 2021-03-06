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

    const pro = firstEntityValue(entities, 'profession');
	const sub = firstEntityValue(entities, 'subject');
console.log("profession"+pro);
console.log("Subject"+sub);	
if(sub == null && pro == null){
	context.missingSubPro = true ;
}
if(sub != null && pro == null){
	context.missingPro = sub ;
	context.sub = sub;
}
if(sub == null && pro != null){
	context.missingSub = pro ;
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
 ['Send-finalOptions'](sessionId, context, cb) {
	  const recipientId = context._fbid_;
	  if(context.sub == 'undefined')
	  {      FB.fbMessage(recipientId, "Sorry, We don't have course fo that.", (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        cb();
      });}
  else{ FB.fbgenericButton(recipientId,context.sub,context.selectedOpt, (err, data) => {
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

	 }


	 },

};


const getWit = () => {
  return new Wit(Config.WIT_TOKEN, actions);
};

exports.getWit = getWit;


if (require.main === module) {
  console.log("Bot testing mode.");
  const client = getWit();
  client.interactive();
}