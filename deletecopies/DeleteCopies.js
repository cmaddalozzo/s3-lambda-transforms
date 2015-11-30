// dependencies
var async = require('async');
var AWS = require('aws-sdk');

var sizes = ['small', 'medium', 'large'];

// get reference to S3 client 
var s3 = new AWS.S3();
 
exports.handler = function(event, context) {
  // Read options from the event.
  console.log('Starting copy deletion.');
  var bucket = event.Records[0].s3.bucket.name;

  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  // Sanity check to make sure key starts with "orig/".
  if(!/^orig\//.test(srcKey)){
    console.error('Key doesn\'t match expected format:' + srcKey);
    return;
  }

  var baseKey = srcKey.match(/^orig\/(.*)/)[1];

  // Stream the transformed image to a different S3 bucket.
  async.each(sizes, function(size, cb){
    var key = size + '/' + baseKey;
    console.log('Delete ' + key);
    s3.deleteObject({
        Bucket: bucket,
        Key: key,
      }, cb);
  }, function (err) {
    if (err) {
      console.error(
        'Unable to delete ' + bucket + '/' + srcKey +
        ' due to an error: ' + err
      );
    } else {
      console.log(
        'Successfully deleted ' + bucket + '/' + srcKey + ' and copies.'
      );
    }
    context.done();
  });
};

