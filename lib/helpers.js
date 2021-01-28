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

module.exports = helpers;
