/*
 * Primary file for the API.
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// HTTP Server Instance
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});
// HTTP Server Start
httpServer.listen(config.httpPort, () => {
  console.log(`Up and running!\nIn environment: >>> ${config.envName.toUpperCase()} <<<\nAt port: ${config.httpPort}\n`);
});

// HTTPS Server Options
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};
// HTTPS Server Instance
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});
// HTTP Server Start
httpsServer.listen(config.httpsPort, () => {
  console.log(`Up and running!\nIn environment: >>> ${config.envName.toUpperCase()} <<<\nAt port: ${config.httpsPort}\n`);
});

// Common Server Logic
const unifiedServer = (req, res) => {
  // Get the URL and parse it.
  const parsedURL = url.parse(req.url, true);

  // Get the path from the URL.
  const path = parsedURL.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the HTTP method.
  const method = req.method.toLowerCase();

  // Get the Query String Object.
  const qso = parsedURL.query;

  // Get the headers as an object.
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  // data is an event that the request object emits
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  // on req.end
  req.on('end', () => {
    buffer += decoder.end();
    // Choose the handler this request should go to
    // If one is not found, use the notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined'
                          ? router[trimmedPath]
                          : handlers.notFound;
    // Construct the data object we send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'method': method,
      'queryStringParametersObject': qso,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }
    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      // Use the payload called back by the handler or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};
      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);
      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      // Logging out to the console
      console.log('Returning this response: ', statusCode, payloadString);
    });
  });
};

// Router
const router = {
  'ping': handlers.ping,
  'hello': handlers.hello,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
};
