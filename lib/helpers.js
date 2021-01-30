/*
 * Helpers for Various Tasks
 *
 */

// Dependencies
const crypto = require('crypto');

const config = require('../config');

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
    }
    return str;
  } else {
    return false;
  }
}

module.exports = helpers;
