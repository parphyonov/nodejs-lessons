// # Course Notes at www.pirple.com

// ## Section 2 - Background Information

// 🙀 https://github.com/airbnb/javascript 🙀

// ## Section 3 - Building a RESTful API

// Returning JSON
res.setHeader('Content-Type', 'application/json');

// Adding Configuration
// TERMINAL >>> NODE_ENV=staging node index.js
function addConfiguration() {
  const environments = {};
  environments.envA = {};
  environments.envB = {};
  const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() | '';
  const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : config.envA;
  module.exports = environmentToExport;
}

// Adding HTTPS Supports
// 🙀🙀🙀 !!! OPENSSL !!! 🙀🙀🙀
// TERMINAL >>> openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
function addHTTPSSupport() {
  // HTTP and HTTPS conflict with each other
  // 🙀🙀 HTTP Port 80 by convention 🙀🙀
  // 🙀🙀 HTTPS Port 443 by convention 🙀🙀
  const https = require('https');
  const fs = requrie('fs');
  const httpsServerOptions = {
    'key': fs.readFileSync('./https/key1.pem'),
    'cert': fs.readFileSync('./https/cert1.pem')
  };
  const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServerFunction(req, res);
  });
  httpsServer.listen(config.httpsPort, () => console.log(config.httpsPort));
}

// Service 1: /ping
function s1ping() {

}

// Storing Data
function storeData() {
  // Create a hidden folder (by convention) .data
  // Create lib directory
  // Create a file lib/data.js
  // Dependencies
  const fs = require('fs');
  const path = require('path');
  // Container for the module (to be exported)
  const lib = {};
  // Define the base directory for the data folder
  lib.baseDir = path.join(__dirname, '/../.data/');
  // Write data to a file
  lib.create = (dir, filename, data, callback) => {
    // Open the file for writing, 'wx' is a flag
    fs.open(lib.baseDir + dir + '/' + filename + '.json', 'wx', (error, fileDescriptor) => {
      if (!error && fileDescriptor) {
        // convert data to string
        const dataString = JSON.stringify(data);
        // write to file and close it
        fs.writeFile(fileDescriptor, dataString, error => {
          if (!error) {
            fs.close(fileDescriptor, error => {
              if (!error) {
                callback(false);
              } else {
                callback('Error closing the new file.');
              }
            });
          } else {
            callback('Error writing to new file.');
          };
        });
      } else {
        callback('Could not create new file, it may already exist.');
      };
    });
  };
  // Exporting
  module.exports = lib;
  // INDEX.JS
  // TESTING CREATE FILE
  // @TODO to delete this
  _data.create('test', 'newFile', {'test_key': 'test_value'}, error => {
    console.error(error);
  });
}
