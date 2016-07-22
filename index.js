'use strict'


const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');
const https = require('https');

let Wit = null;
let log = null;
try {
  Wit = require('../').Wit;
  log = require('../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

const PORT = process.env.PORT || 8445;

const WIT_TOKEN = process.env.WIT_TOKEN;

const FB_PAGE_ID = process.env.FB_PAGE_ID;
if (!FB_PAGE_ID) { throw new Error('missing FB_PAGE_ID') }
const FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
const FB_APP_SECRET = process.env.FB_APP_SECRET;
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

let FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  FB_VERIFY_TOKEN = buff.toString('hex');
  console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    return json;
  });
};

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
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

const actions = {
  send({sessionId}, {text}) {
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      return fbMessage(recipientId, text)
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred in send while forwarding the response to',
          recipientId,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      return Promise.resolve()
    }
  },
    send_wit({sessionId}, {text}) {
      https.get('https://graph.facebook.com/v2.6/'+sessions[sessionId].fbid+'?access_token=EAAENS5edtgwBALelfsMwtZAgqodfCCB0EsYjcEP2onKuSDVOOmyPvFqiyr97ilTtRxPT5Mt9JmJZC0RqJvrUGzkLHWujLLLZBDcZAkPhiixfm1RF7QV03PYP931hTrz2qj8DjBOaZCz5PUZAKsZA4rcBkUBRmzKZB5BhtSIG12BePAZDZD', function(res) {
    res.on("data", function(chunk) {
      var info = JSON.parse(chunk);
    if (sessions[sessionId].fbid) {
      return fbMessage(sessions[sessionId].fbid, "yo "+info.first_name+" !")
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred in send_wit while forwarding the response to',
          sessions[sessionId].fbid,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      return Promise.resolve()
    }
  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});
    
  },
};

const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});

const app = express();
app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/webhook', (req, res) => {

  const data = req.body;
  if (data.object === 'page') {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message) {
          const sender = event.sender.id;

          const sessionId = findOrCreateSession(sender);
          const {text, attachments} = event.message;

          if (attachments) {
            fbMessage(sender, 'Sorry I can only process text messages for now.')
            .catch(console.error);
          } else if (text) {
            wit.runActions(
              sessionId, 
              text, 
              sessions[sessionId].context 
            ).then((context) => {
              console.log('Waiting for next user messages');

              // if (context['done']) {
              //   delete sessions[sessionId];
              // }

              sessions[sessionId].context = context;
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
});


function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

app.listen(PORT);
console.log('Listening on :' + PORT + '...');

// function sendTextMessage(sender, text) {
    // let messageData = { text:text }
    // request({
        // url: 'https://graph.facebook.com/v2.6/me/messages',
        // qs: {access_token:token},
        // method: 'POST',
        // json: {
            // recipient: {id:sender},
            // message: messageData,
        // }
    // }, function(error, response, body) {
        // if (error) {
            // console.log('Error sending messages: ', error)
        // } else if (response.body.error) {
            // console.log('Error: ', response.body.error)
        // }
    // })
// }