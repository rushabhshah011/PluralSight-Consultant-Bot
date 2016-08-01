'use strict';


const request = require('request');
const Config = require('./const.js');
var utf8 = require('utf8');
var fbmsg = "";

const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: {
    access_token: Config.FB_PAGE_TOKEN
  },
  headers: {
    'Content-Type': 'application/json'
  },
});


const fbMessage = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
        text: msg,
      },
    },
  };

  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};

const sendfbURL = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":msg,
        "buttons":[
          {
            "type":"web_url",
            "url":"https://www.pluralsight.com/browse",
            "title":"Show Website"
          }
        ]
      }
    }
  },
    },
  };

  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};

const fbSendButtons = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":msg,
        "buttons":[
          {
            "type":"postback",
            "title":"Newest Courses",
            "payload":"courses"
          },
		  {
            "type":"postback",
            "title":"Learning Path",
            "payload":"path"
          },
		  {
            "type":"postback",
            "title":"Live Mentoring",
            "payload":"mentor"
          }
        ]
      }
    }
  }
  }
  };

  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};


const fbQuickreply = (recipientId, msg,opt,t1,t2, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
    "text": msg,
    "quick_replies":[
      {
        "content_type":"text",
        "title":t1,
        "payload":opt
      },
      {
        "content_type":"text",
        "title":t2,
        "payload":"n"+opt
      }
    ]
  }
  }
  };

  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};


const getFirstMessagingEntry = (body) => {
  const val = body.object === 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].messaging &&
    Array.isArray(body.entry[0].messaging) &&
    body.entry[0].messaging.length > 0 &&
    body.entry[0].messaging[0];

  return val || null;
};


module.exports = {
  getFirstMessagingEntry: getFirstMessagingEntry,
  fbMessage: fbMessage,
  fbReq: fbReq,
  fbSendButtons:fbSendButtons,
  fbQuickreply:fbQuickreply,
  sendfbURL:sendfbURL
};