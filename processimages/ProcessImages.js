// dependencies
var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm')
            .subClass({ imageMagick: true }); // Enable ImageMagick integration.
var util = require('util');

// constants
var MAX_WIDTH  = 100;
var MAX_HEIGHT = 100;
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

// get reference to S3 client 
var s3 = new AWS.S3();
 
exports.handler = function(event, context) {
  "use strict";
  // Read options from the event.
  console.log('Starting image processing.');
  var srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  if(!/^orig\//.test(srcKey)){
    console.error('Key doesn\'t match expected format:' + srcKey);
    return;
  }

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
  // Download the image from S3, transform, and upload to a different S3 bucket.
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
      async.parallel({
        small: function(cb){
          gm(response.Body).size(function(err, size) {
            // Infer the scaling factor to avoid stretching the image unnaturally.
            var scalingFactor = sizes.small.width / size.width;
            var width  = scalingFactor * size.width;
            var height = scalingFactor * size.height;
            // Transform the image buffer in memory.
            this.resize(width, height)
              .toBuffer(imageType, function(err, buffer) {
                if (err) {
                  cb(err);
                } else {
                  cb(null, {contentType: response.ContentType, data: buffer});
                }
              });
          });
        },
        medium: function(cb){
          gm(response.Body).size(function(err, size) {
            // Infer the scaling factor to avoid stretching the image unnaturally.
            var scalingFactor = sizes.medium.width / size.width;
            var width  = scalingFactor * size.width;
            var height = scalingFactor * size.height;
            // Transform the image buffer in memory.
            this.resize(width, height)
              .toBuffer(imageType, function(err, buffer) {
                if (err) {
                  cb(err);
                } else {
                  cb(null, {contentType: response.ContentType, data: buffer});
                }
              });
          });
        },
        large: function(cb){
          gm(response.Body).size(function(err, size) {
            // Infer the scaling factor to avoid stretching the image unnaturally.
            var scalingFactor = sizes.large.width / size.width;
            var width  = scalingFactor * size.width;
            var height = scalingFactor * size.height;
            // Transform the image buffer in memory.
            this.resize(width, height)
              .toBuffer(imageType, function(err, buffer) {
                if (err) {
                  cb(err);
                } else {
                  cb(null, {contentType: response.ContentType, data: buffer});
                }
              });
          });
        }
      }, function(err, results){
        next(null, results);
      });
    },
    function upload(images, next) {
      // Stream the transformed image to a different S3 bucket.
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

