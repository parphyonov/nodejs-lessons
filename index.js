/*
 * Primary file for the API.
 *
 */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all requests with a string.
const server = http.createServer((req, res) => {

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
      'payload': buffer
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
      res.writeHead(statusCode);
      res.end(payloadString);
      // Logging out to the console
      console.log('Returning this response: ', statusCode, payloadString);
    });
  });
});

// Start the server and have it listen on port 3000.
server.listen(3000, () => {
  console.log('Up and running at Port 3000!');
});

// Defining the handlers
const handlers = {};
// Sample handler
handlers.sample = (data, callback) => {
  // Callback a HTTP status code and a payload object
  callback(406, {'name': 'sample handler'});
};
// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Defining a request router for our application
const router = {
  'sample': handlers.sample
};
