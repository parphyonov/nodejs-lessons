/*
 * Library for Storing and Editing data
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');

// Container for the module (to be exported)
const lib = {};
// Define the base directory for the data folder
lib.baseDir = path.join(__dirname, './../.data/');
// Write data to a file
lib.create = (dir, filename, data, callback) => {
  // Open the file for writing, 'wx' is a flag
  const fullPath = lib.baseDir + dir + '/' + filename + '.json';
  fs.open(fullPath, 'wx', (error, fileDescriptor) => {
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

lib.read = (dir, filename, callback) => {
  fs.readFile(`${lib.baseDir}${dir}/${filename}.json`, 'utf-8', (error, data) => {
      callback(data, error);
  });
};

lib.update = (dir, filename, newData, callback) => {
  // Open the file for writing
  fs.open(`${lib.baseDir}${dir}/${filename}.json`, 'r+', (e, fd) => {
    if (!e && fd) {
      const dataString = JSON.stringify(newData);
      // Truncate the file
      fs.ftruncate(fd, e => {
        if (!e) {
          // Write to the file and close it
          fs.writeFile(fd, dataString, e => {
            if (!e) {
              fs.close(fd, e => {
                if (!e) {
                  callback(false);
                } else {
                  callback('Error closing existing file.');
                };
              });
            } else {
              callback('Error writing to existing file.')
            };
          });
        } else {
          callback('Error truncating file.');
        };
      });
    } else {
      callback('Could not open the file for updating, it might not exist yet.');
    };
  });
};

lib.delete = (dir, filename, callback) => {
  // Unlink the file from the file system
  fs.unlink(`${lib.baseDir}${dir}/${filename}.json`, e => {
    if (!e) {
      callback(false);
    } else {
      callback('Error unlinking the file.');
    };
  });
};

// Exporting
module.exports = lib;
