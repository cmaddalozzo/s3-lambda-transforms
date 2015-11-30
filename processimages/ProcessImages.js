var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm')
            .subClass({ imageMagick: true }); // Enable ImageMagick integration.

var sizes = {
  small: {
    width: 300
  },
  medium: {
    width: 600
  },
  large: {
    width: 1200
  }
};

var s3 = new AWS.S3();
 
exports.handler = function(event, context) {
  "use strict";
  // Read options from the event.
  console.log('Starting image processing...');
  var srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  if(!/^orig\//.test(srcKey)){
    console.error('Key doesn\'t match expected format:' + srcKey);
    return;
  }

  // This the file path without orig/ at the beginning.
  var outKey = srcKey.match(/^orig\/(.*)/)[1];

  // Infer the image type.
  var typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.error('Unable to infer image type for key: ' + srcKey);
    return;
  }
  var imageType = typeMatch[1];
  if (imageType !== "jpg" && imageType !== "jpeg" && imageType !== "png") {
    console.log('Skipping non-image: ' + srcKey);
    return;
  }
  // Download the image from S3, transform, and upload copies.
  async.waterfall([
    function download(next) {
      // Download the image from S3 into a buffer.
      s3.getObject({
          Bucket: srcBucket,
          Key: srcKey
        },
        next);
    },
    function transform(response, next) {
      var results = {};
      async.forEachOf(sizes, function(dimensions, sizeName, cb){
        console.log('Processing ' + sizeName);
        gm(response.Body).size(function(err, size) {
          // Infer the scaling factor to avoid stretching the image unnaturally.
          var scalingFactor = dimensions.width / size.width;
          var width  = scalingFactor * size.width;
          var height = scalingFactor * size.height;
          // Transform the image buffer in memory.
          this.resize(width, height)
            .toBuffer(imageType, function(err, buffer) {
              if (err) {
                cb(err);
              } else {
                results[sizeName] = {
                  contentType: response.ContentType, 
                  data: buffer
                };
                cb();
              }
            });
        });
      }, function(err){
        next(err, results);
      });
    },
    function upload(images, next) {
      // Stream the transformed image to the appropriate place in this bucket.
      async.forEachOf(images, function(image, size,  cb){
        s3.putObject({
            Bucket: event.Records[0].s3.bucket.name,
            Key: size + '/' + outKey,
            Body: image.data,
            ContentType: image.contentType
          },
          cb);
      }, next);
    }
    ], function (err) {
      if (err) {
        console.error(
          'Unable to resize ' + srcBucket + '/' + srcKey +
          ' due to an error: ' + err
        );
      } else {
        console.log(
          'Successfully resized ' + srcBucket + '/' + srcKey + '.'
        );
      }
      context.done();
  });
};

