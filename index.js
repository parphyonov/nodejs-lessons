/*
 * Primary file for the API.
 *
 */

// Dependencies
const http = require('http');
const url = require('url');

// The server should respond to all requests with a string.
const server = http.createServer((req, res) => {

  // Get the URL and parse it.
  const parsedURL = url.parse(req.url, true);

  // Get the path from the URL.
  const path = parsedURL.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Send the response.
  res.end('Hello, world!\n');

  // Log the request path.
  console.log(`Request received on path: ${trimmedPath}`);

});

// Start the server and have it listen on port 3000.
server.listen(3000, () => {
  console.log('Up and running at Port 3000!');
});
