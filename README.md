This repo contains 2 AWS Lambda functions that can be used to manage automatic creation and deletion of resized images assets in an S3 bucket. The functions are triggered when assets matching a specific key prefix are uploaded or deleted. These Lambda functions are based on the [AWS Lambda walkthrough](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser.html).

For example, the upload of `orig/photo.jpg` could be configured to automatically create `small/photo.jpg` and `large/photo.jpg` assets.

#### Creation of the Lamba functions

Create the ProcessImages function as follow:

    aws lambda create-function \
    --function-name ProcessImages \
    --zip-file fileb://ProcessImages.zip \
    --handler ProcessImages.handler \
    --runtime nodejs \
    --timeout 10 \
    --memory-size 1024 \

Create the DeleteCopies function as follows:

    aws lambda create-function \
    --function-name DeleteCopies \
    --zip-file fileb://deletecopies/DeleteCopies.zip \
    --handler DeleteCopies.handler \
    --runtime nodejs \
    --timeout 10 \
    --memory-size 1024 \
    

#### Deploy changes

The included deploy script can be run to upload changes to your Lambda functions. Just invoke it by running `./deploy` in the repo's root directory. 


