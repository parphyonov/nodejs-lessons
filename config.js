/*
 * Create and import configuartion variables
 *
 */

 // 1. Start your app with NODE_ENV=myEnvironmentName node index.js
 // 2. Put your configuration in a file (e.g. config.js) which has a switch inside of it.
 // 3. That switch should read process.env.NODE_ENV to determine the current environment and export only the config variables for that environment.

 // Container for all the environments
 const environments = {};

 // Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging'
};

environments.production = {
  httpPort: 80,
  httpsPort: 443,
  envName: 'production'
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
// Check if this environment exists, if not default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
