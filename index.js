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
  if (messaging && messaging.message) {
    const sender = messaging.sender.id;
    const sessionId = findOrCreateSession(sender);
    const msg = messaging.message.text;
    const atts = messaging.message.attachments;
	if (msg == "done") {
        delete sessions[sessionId];
    }
    if (atts) {
      FB.fbMessage(
        sender,
        'Sorry I can only process text messages for now.'
      );
    } else if (msg) {
		console.log(msg);
		     if (msg == "done") {
				 console.log("yo bro we are here");
               delete sessions[sessionId];
             }
			if(messaging.message.quick_reply){
				if(messaging.message.quick_reply.payload == 'nCourses')
				{
					var url = "https://www.pluralsight.com/browse";
					FB.sendfbURL(sender,"You can browse "+messaging.message.quick_reply.payload.slice(1)+" here.",url);
				}
				if(messaging.message.quick_reply.payload == 'nPaths')
				{
					var url = "https://www.pluralsight.com/resource-center/playlists";
					FB.sendfbURL(sender,"You can browse Learning "+messaging.message.quick_reply.payload.slice(1)+" here.",url);
				}
				if(messaging.message.quick_reply.payload == 'nMentors')
				{
					var url = "https://www.pluralsight.com/product/mentoring";
					FB.sendfbURL(sender,"You can look for Live "+messaging.message.quick_reply.payload.slice(1)+" here.",url);
				}
				if(messaging.message.quick_reply.payload == 'Courses' || messaging.message.quick_reply.payload == 'Paths' || messaging.message.quick_reply.payload == 'Mentors'){
					FB.fbQuickreply(sender,"Are you looking for you self?",messaging.message.quick_reply.payload.toLowerCase(),"Individual","Business");
				}
				if(messaging.message.quick_reply.payload == 'ncourses' || messaging.message.quick_reply.payload == 'npaths' || messaging.message.quick_reply.payload == 'nmentors')
				{
					var url = "https://billing.pluralsight.com/checkout?sku=ENT-PILOT&numUsers=2";
					FB.sendfbURL(sender,"Sorry, I am programmed to help Individuals only. You can Enquire for FREE PILOT here.",url);
				}
				if(messaging.message.quick_reply.payload == 'courses' || messaging.message.quick_reply.payload == 'paths' || messaging.message.quick_reply.payload == 'mentors')
				{
				sessions[sessionId].context.selectedOpt = messaging.message.quick_reply.payload;
	   			FB.fbMessage(sender,'What is your Profession?');
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
            sessions[sessionId].context = context;
          }
        }
      );
			}
    }
  }
  res.sendStatus(200);
});