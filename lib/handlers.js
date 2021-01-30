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
  callback(200, {welcome_message: 'Hello, world!'});
};

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    // 405 Status Code = 'Method Not Allowed';
    callback(405);
  }
};

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
// @TODO Only let an authenticated user access their object
// @TODO Don't let them access anyone else's
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringParametersObject.phone) === 'string'
                && data.queryStringParametersObject.phone.trim().length === 10
                ? data.queryStringParametersObject.phone.trim()
                : false;
  if (phone) {
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
    callback(400, {error: 'Missing required field'});
  }
};

// Handlers _users PUT
// Required Data: phone
// Optional Data: firstName, lastName, password
// AT LEAST ONE MUST BE SPECIFIED
// @TODO Only let an authenticated user update their own object
// Don't let them update anyone else's
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
      callback(500, {error: 'Nothing to update!'});
    };
  } else {
    callback(400, {error: 'Missing required field!'});
  }
};

// Handlers _users DELETE
// Required Fiels: phone
// Optional Fields: none
// @TODO Only let an authenticated user delete their object.
// Don't let them delete anyone else's
// @TODO Clean up (delete) any other data files associated with this user.
handlers._users.delete = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringParametersObject.phone) === 'string'
                && data.queryStringParametersObject.phone.trim().length === 10
                ? data.queryStringParametersObject.phone.trim()
                : false;
  if (phone) {
    _data.read('users', phone, (err, data) => {
      console.log(data);
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
    callback(400, {error: 'Missing required field'});
  };
};

// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Exporting the handlers
module.exports = handlers;
