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
