/*
 * Helpers for Various Tasks
 *
 */

// Dependencies
const crypto = require('crypto');

const config = require('../config');

const querystring = require('querystring');

const https = require('https');

const helpers = {};

// Create a SHA256 hash
helpers.hash = str => {
  if (typeof(str) === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  };
};

// Parse a JSON string to an object in all cases without throwing errors
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
};

// Create a string of alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLenth = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // Start the final string
    let str = '';
    for (let i = 0; i < strLength; i += 1) {
      const randomIndex = Math.floor(Math.random() * possibleCharacters.length);
      str += possibleCharacters[randomIndex];
    };
    return str;
  } else {
    return false;
  };
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = (phone, message, callback) => {
  // validate parameters
  phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false;
  message = typeof(message) === 'string' && message.trim().length > 0 && message.trim().length < 1600 ? message.trim() : false;
  if (phone && message) {
    // Configure the request payload
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+7' + phone,
      'Body': message
    };
    // Stringify the payload
    const stringPayload = querystring.stringify(payload);
    // Configure the request details
    // We don't need to declare Buffer, it is a globally available variable
    const requestDetails = {
      'protocol': 'https:',
      'hosthame': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };
    // Instantiate the request object
    const request = https.request(requestDetails, res => {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback(`Status code returned was ${status}`);
      };
    });
    // Bind to the error event so it doesn't get thrown
    request.on('error', err => {
      callback(err);
    });
    // Add the payload to the request (that is a separate step)
    request.write(stringPayload);
    // End the request
    request.end();
  } else {
    callback('Given parameters were missing or invalid')
  }
}

module.exports = helpers;
