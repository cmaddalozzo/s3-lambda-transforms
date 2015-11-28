aws lambda create-function \
  --region us-west-2 \
  --function-name ProcessImages \
  --zip-file fileb://ProcessImages.zip \
  --role arn:aws:iam::263315382302:role/executionrole \
  --handler ProcessImages.handler \
  --runtime nodejs \
  --timeout 10 \
  --memory-size 1024 \
  --profile leisure
