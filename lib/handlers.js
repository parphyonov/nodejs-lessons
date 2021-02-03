/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

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

// USERS
handlers._users = {};
// Handlers _users POST
// Required Data: First Name, Last Name, Phone, password, tosAgreement
// Optional Data: none
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

// Handlers _users GET
// Required Data: phone
// Optional Data: none
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

// Handlers _users PUT
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
};

// Handlers _users DELETE
// Required Fiels: phone
// Optional Fields: none
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

// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Exporting the handlers
module.exports = handlers;
