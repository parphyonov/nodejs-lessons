_data.create('test', 'newFile', {'foo': 'bar'}, error => console.error(error));

_data.read('test', 'newFile', (error, data) => {
  if (!error && data) {
    console.log(data);
  } else {
    console.error(error);
  }
});
_data.update('test', 'newFile', {'bar': 'foo'}, error => console.error(error));
_data.delete('test', 'newFile', error => console.error(error));
