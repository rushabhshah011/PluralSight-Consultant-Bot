'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const bot = require('./bot.js');
const Config = require('./const.js');
const FB = require('./facebook.js');

const wit = bot.getWit();

const PORT = process.env.PORT || 8445;

// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      sessionId = k;
    }
  });
  if (!sessionId) {
    sessionId = new Date().toISOString();
    sessions[sessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    }; 
  }
  return sessionId;
};

const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());
console.log("I'm wating for you @" + PORT);

app.get('/', function(req, res) {
  res.send('"Only those who will risk going too far can possibly find out how far one can go." - T.S. Eliot');
});

app.get('/webhook', (req, res) => {
  if (!Config.FB_VERIFY_TOKEN) {
    throw new Error('missing FB_VERIFY_TOKEN');
  }
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === Config.FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/webhook', (req, res) => {
  const messaging = FB.getFirstMessagingEntry(req.body);
  if(messaging.postback)
  {
	const msg = messaging.postback.payload;  
	const sender = messaging.sender.id;
	FB.fbQuickreply(sender,"I will need to ask you few question. Will you please answer them?",msg,"Yes","No");
	console.log(messaging);
  }
//    if(messaging.message.quick_reply)
//  {
	// messaging.message.quick_reply.payload
//  }
  if (messaging && messaging.message) {
    const sender = messaging.sender.id;
    const sessionId = findOrCreateSession(sender);
    const msg = messaging.message.text;
    const atts = messaging.message.attachments;
    if (atts) {
      FB.fbMessage(
        sender,
        'Sorry I can only process text messages for now.'
      );
    } else if (msg) {
			if(messaging.message.quick_reply){
				console.log("okay we are here");
				console.log(messaging.message.quick_reply);
				if(messaging.message.quick_reply.payload == 'ncourses')
				{
					FB.sendfbURL(sender,"You can browse "+messaging.message.quick_reply.payload+" here.");
				}
				if(messaging.message.quick_reply.payload == 'courses'){
					FB.fbQuickreply(sender,"Are you looking for you self?","indi"+msg,"Business","Individual");
				}
				if(messaging.message.quick_reply.payload == 'indiYes' || messaging.message.quick_reply.payload == 'nindiYes'){
					      FB.fbMessage(
        sender,
        'What do you do?'
      );
				}
			}
			else{
							wit.runActions(
			sessionId, 
			msg,  
			sessions[sessionId].context, 
			(error, context) => {
			if (error) {
				console.log('Oops! Got an error from Wit:', error);
			} else {
				console.log('Waiting for futher messages.');
            // if (context['done']) {
            //   delete sessions[sessionId];
            // }
            sessions[sessionId].context = context;
          }
        }
      );
			}
    }
  }
  res.sendStatus(200);
});