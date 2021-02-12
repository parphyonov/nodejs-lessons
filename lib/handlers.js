/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const maxChecks = require('../config').maxChecks;

// Handlers
const handlers = {};
// Ping handler
handlers.ping = (data, callback) => {
  // Callback a HTTP status code and a payload object
  callback(200);
};
handlers.hello = (data, callback) => {
  callback(200, { welcome_message: 'Hello, world!' });
};

// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    // 405 Status Code = 'Method Not Allowed';
    callback(405, { error: 'Useers Method Not Allowed!' });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { error: 'Tokens Method Not Allowed!' });
  };
};

// Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  const method = data.method;
  if (acceptableMethods.indexOf(method) > -1) {
    handlers._checks[method](data, callback);
  } else {
    callback(405, {error: 'Method not allowed!'});
  };
};

// USERS
handlers._users = {};
// Required Data: First Name, Last Name, Phone, password, tosAgreement
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string'
                    && data.payload.firstName.trim().length > 0
                    ? data.payload.firstName.trim()
                    : false;
  const lastName = typeof(data.payload.lastName) === 'string'
                   && data.payload.lastName.trim().length > 0
                   ? data.payload.lastName.trim()
                   : false;
  const phone = typeof(data.payload.phone) === 'string'
                && data.payload.phone.trim().length === 10
                ? data.payload.phone.trim()
                : false;
  const password = typeof(data.payload.password) === 'string'
                   && data.payload.password.trim().length > 0
                   ? data.payload.password.trim()
                   : false;
  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean'
                       && data.payload.tosAgreement !== false
                       ? true
                       : false;
  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          const userObj = { firstName, lastName, phone, password: hashedPassword, tosAgreement: true };
          // Store the user
          _data.create('users', phone, userObj, err => {
            if (!err) {
              callback(200, {'message': 'User successfully added!'});
            } else {
              console.error(err);
              callback(500, {'error': 'Failed to create new user!'});
            };
          });
        } else {
          callback(500, {'error': 'Failed to hash the user\'s password!'});
        };
      } else {
        // User already exists
        callback(400, {'error': 'A user with that phone number already exists!'});
      }
    });
  } else {
    callback(400, {'error': 'Missing required fields!'});
  };
};
// Required Data: phone
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringParametersObject.phone) === 'string'
                && data.queryStringParametersObject.phone.trim().length === 10
                ? data.queryStringParametersObject.phone.trim()
                : false;
  if (phone) {
    // Get the token from the headers
    const tokenId = typeof(data.headers.token) === 'string'
                    ? data.headers.token
                    : false;
    // Verify that the given token from the headers is valid for the phone number
    handlers._tokens.verifyToken(tokenId, phone, tokenIsValid => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            // Remove the hashed password from the user object
            // before returning it to the requestor
            delete data.password;
            callback(200, data);
          } else {
            callback(404, {error: 'User not found'});
          }
        });
      } else {
        callback(403, {error: 'Missing required token in header or token is invalid!'});
      }
    });
  } else {
    callback(400, {error: 'Missing required field'});
  }
};
// Required Data: phone
// Optional Data: firstName, lastName, password
// AT LEAST ONE MUST BE SPECIFIED
handlers._users.put = (data, callback) => {
  // Check for the required field
  const phone = typeof(data.payload.phone) === 'string'
                && data.payload.phone.trim().length === 10
                ? data.payload.phone.trim()
                : false;
  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) === 'string'
                    && data.payload.firstName.trim().length > 0
                    ? data.payload.firstName
                    : false;
  const lastName = typeof(data.payload.lastName) === 'string'
                    && data.payload.lastName.trim().length > 0
                    ? data.payload.lastName
                    : false;
  const password = typeof(data.payload.password) === 'string'
                    && data.payload.password.trim().length > 0
                    ? data.payload.password
                    : false;
  if (phone) {
    if (firstName || lastName || password) {
      const tokenId = typeof(data.headers.token) === 'string' && data.headers.token.trim().length === 20 ? data.headers.token.trim() : false;
      handlers._tokens.verifyToken(tokenId, phone, tokenIsValid => {
        if (tokenIsValid) {
          _data.read('users', phone, (err, data) => {
            if (!err && data) {
              if (firstName) {
                data.firstName = firstName;
              };
              if (lastName) {
                data.lastName = lastName;
              };
              if (password) {
                data.password = helpers.hash(password);
              };
              _data.update('users', phone, data, err => {
                if (!err) {
                  callback(200, {message: 'User successfully updated!'});
                } else {
                  console.error(err);
                  callback(500, 'Failed to update user!');
                };
              });
            } else {
              callback(400, {error: 'The user doesn\'t exist!'});
            };
          });
        } else {
          callback(403, {error: 'Missing required token in header or token is invalid!'});
        }
      });
    } else {
      callback(500, {error: 'Nothing to update!'});
    };
  } else {
    callback(400, {error: 'Missing required field!'});
  }
}
// Required Fiels: phone
// @TODO Clean up (delete) any other data files associated with this user.
handlers._users.delete = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringParametersObject.phone) === 'string'
                && data.queryStringParametersObject.phone.trim().length === 10
                ? data.queryStringParametersObject.phone.trim()
                : false;
  if (phone) {
    const tokenId = typeof(data.headers.token) === 'string' && data.headers.token.trim().length === 20 ? data.headers.token.trim() : false;
    handlers._tokens.verifyToken(tokenId, phone, tokenIsValid => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            _data.delete('users', phone, err => {
              if (!err) {
                callback(200, {message: 'User successfully deleted!'});
              } else {
                callback(500, {error: 'User was not deleted!'});
              }
            });
          } else {
            callback(400, {error: 'User not found'});
          };
        });
      } else {
        callback(403, {error: 'Missing required token in header or token is invalid!'});
      }
    });
  } else {
    callback(400, {error: 'Missing required field'});
  };
};

// TOKENS
handlers._tokens = {};
// Required data: phone, password
handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) === 'string'
                && data.payload.phone.trim().length === 10
                ? data.payload.phone.trim()
                : false;
  const password = typeof(data.payload.password) === 'string'
                   && data.payload.password.trim().length > 0
                   ? data.payload.password.trim()
                   : false;
  if (phone && password) {
    // Look up the user who matches that phone number
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        if (data.password === helpers.hash(password)) {
          // If valid, create a new token with a random name,
          // set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          // 1000ms in a second & 60 seconds & 60 minutes
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObj = { phone, tokenId, expires };
          // Store the token
          _data.create('tokens', tokenId, tokenObj, err => {
            if (!err) {
              callback(200, { message: 'New token created!', tokenObj });
            } else {
              callback(500, { error: 'Failed to create token!' });
            };
          });
        } else {
          callback(400, { error: 'Wrong password!' });
        };
      } else {
        callback(404, { error: 'Wrong username!' });
      }
    });
  } else {
    callback(400, { error: 'Missing Required Fields [phone, password]' });
  };
};
// Required data: tokenId
handlers._tokens.get = (data, callback) => {
  const tokenId = typeof(data.queryStringParametersObject.tokenId) === 'string'
                  && data.queryStringParametersObject.tokenId.length === 20
                  ? data.queryStringParametersObject.tokenId
                  : false;
  if (tokenId) {
    _data.read('tokens', tokenId, (err, data) => {
      if (!err && data) {
        callback(200, {
          message: 'Token Successfully Read!',
          data: data
        });
      } else {
        callback(400, { error: 'Token Not Found! [' + tokenId + ']' });
      };
    });
  } else {
    callback(404, { error: 'Required Field Missing! [tokenId]' });
  };
};
// Required data: tokenId, extend
handlers._tokens.put = (data, callback) => {
  const tokenId = typeof(data.payload.tokenId) === 'string'
                  && data.payload.tokenId.length === 20
                  ? data.payload.tokenId
                  : false;
  const extend = typeof(data.payload.extend) === 'boolean'
                 && data.payload.extend === true
                 ? true
                 : false;
  if (tokenId && extend) {
    _data.read('tokens', tokenId, (err, data) => {
      if (!err && data) {
        if (data.expires > Date.now()) {
          data.now = Date.now();
          data.oldExt = data.expires;
          data.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens', tokenId, data, error => {
            if (!error) {
              callback(200, data);
            } else {
              callback(500, { error: 'Failed to update the file' });
            };
          });
        } else {
          callback(400, { error: 'The token has expired, and cannot be extended!' });
        };
      } else {
        callback(400, { error: 'The token does not exist!' });
      };
    });
  } else {
    callback(400, { error: 'Missing the required fields or they are invalid!' })
  };
};
// Requireed data: tokenId
handlers._tokens.delete = (data, callback) => {
  const tokenId = typeof(data.queryStringParametersObject.tokenId) === 'string'
                  && data.queryStringParametersObject.tokenId.trim().length === 20
                  ? data.queryStringParametersObject.tokenId.trim()
                  : false;
  if (tokenId) {
    _data.read('tokens', tokenId, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', tokenId, err => {
          if (!err) {
            callback(200, {message: 'The token was successfully deleted!'});
          } else {
            callback(500, {error: 'Failed to delete the token!'});
          };
        });
      } else {
        callback(500, {error: 'This token does not exist!'});
      };
    });
  } else {
    callback(400, {error: 'Missing required fields!'});
  };
};
// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (tokenId, phone, callback) => {
  // Look up the token
  _data.read('tokens', tokenId, (err, data) => {
    if (!err && data) {
      // The token is for the given user and NOT expired
      if (data.phone === phone && data.expires > Date.now()) {
        callback(true)
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// CHECKS
handlers._checks = {};
// Required: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.post = (data, callback) => {
  const source = data.payload;
  const protocol = typeof(source.protocol) === 'string'
                   && ['https', 'http'].indexOf(source.protocol.toLowerCase()) > -1
                   ? source.protocol : false;
  const url = typeof(source.url) === 'string'
              && source.url.trim().length > 0
              ? source.url : false;
  const method = typeof(source.method) === 'string'
                 && ['post', 'get', 'put', 'delete'].indexOf(source.method.toLowerCase()) > -1
                 ? source.method : false;
  const successCodes = typeof(source.successCodes) === 'object'
                       && source.successCodes instanceof Array
                       && source.successCodes.length > 0
                       ? source.successCodes : [];
  const timeoutSeconds = typeof(source.timeoutSeconds) === 'number'
                         && source.timeoutSeconds % 1 === 0
                         && source.timeoutSeconds >= 1
                         && source.timeoutSeconds <= 5
                         ? source.timeoutSeconds : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    const token = typeof(data.headers.token) === 'string' && data.headers.token.trim().length === 20 ? data.headers.token : false;
    _data.read('tokens', token, (err, data) => {
      if (!err && data) {
        const phone = data.phone;
        // Look up the user data
        _data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
            if (maxChecks && userChecks.length < maxChecks) {
              // Create a random id for the check
              const checkId = helpers.createRandomString(20);
              // Create the checks object and include the user's phone
              const checkObject = {
                checkId,
                phone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              };
              _data.create('checks', checkId, checkObject, err => {
                if (!err) {
                  // Add the check's id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  // Save the new user data
                  _data.update('users', phone, userData, err => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {error: 'Error: could not update the user with the new check!'});
                    };
                  });
                } else {
                  callback(500, {error: 'Error creating new check!'});
                };
              });
            } else {
              callback(400, {error: `The user already has the maximum number of checks! [${maxChecks}]`});
            };
          } else {
            callback(403, {error: 'No such user!'});
          };
        });
      } else {
        callback(403, {error: 'Not authorized!'});
      };
    });
  } else {
    callback(400, {error: 'Required fields are missing or they are invalid! [protocol, url, method, successCodes, timeoutSeconds]'});
  };
};
// Required: checkId
handlers._checks.get = (data, callback) => {
  const checkId = typeof(data.queryStringParametersObject.id) === 'string' && data.queryStringParametersObject.id.trim().length === 20 ? data.queryStringParametersObject.id.trim() : false;
  if (checkId) {
    // Look up the check
    _data.read('checks', checkId, (err, checkData) => {
      if (!err && checkData) {
        const token = typeof(data.headers.token) === 'string' && data.headers.token.trim().length === 20 ? data.headers.token.trim() : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.phone, tokenIsValid => {
          if (tokenIsValid) {
            // Return the check data
            callback(200, {
              message: 'Success!',
              requestedData: checkData
            });
          } else {
            callback(403, {error: 'Missing required token in header or this token is invalid!'});
          }
        });
      } else {
        callback(404);
      };
    });
  } else {
    callback(400, {error: 'Missing required field [id] as checkId!'});
  };
};
// Required: checkId
// Optional: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.put = (data, callback) => {
  const checkId = typeof(data.payload.checkId) === 'string' && data.payload.checkId.trim().length === 20 ? data.payload.checkId.trim() : false;
  if (checkId) {
    const protocol = typeof(data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol.toLowerCase()) > -1 ? data.payload.protocol.toLowerCase() : false;
    const url = typeof(data.payload.url) === 'string' && data.payload.url.length > 0 ? data.payload.url : false;
    const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim().toLowerCase()) > -1 ? data.payload.method.trim().toLowerCase() : false;
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', checkId, (err, checkData) => {
        console.log(err);
        if (!err && checkData) {
          const token = typeof(data.headers.token) === 'string' && data.headers.token.trim().length === 20 ? data.headers.token : false;
          handlers._tokens.verifyToken(token, checkData.phone, tokenIsValid => {
            if (tokenIsValid) {
              if (protocol) {
                checkData.protocol = protocol;
              };
              if (url) {
                checkData.url = url;
              };
              if (method) {
                checkData.method = method;
              };
              if (successCodes) {
                checkData.successCodes = successCodes;
              };
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              };
              _data.update('checks', checkId, checkData, err => {
                if (!err) {
                  callback(200, {
                    message: 'Success!',
                    checkData
                  });
                } else {
                  callback(500, {error: 'Failed to update the check data!'});
                }
              });
            } else {
              callback(403, {error: 'Missing required token in header or this token is invalid!'});
            }
          });
        } else {
          callback(500, {error: 'Failed to read the check data!'});
        }
      });
    } else {
      callback(400, {error: 'Nothing to update! All optional fields evaluated to false!'});
    }
  } else {
    callback(400, {error: 'REQUIRED: checkId'});
  };
};

// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Exporting the handlers
module.exports = handlers;
