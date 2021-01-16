/*
 * Primary file for the API.
 *
 */

// Dependencies
const http = require('http');

// The server should respond to all requests with a string.
http.listen(3000, () => {
  console.log('Up and running at Port 3000!');
});
