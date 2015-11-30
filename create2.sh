aws lambda create-function \
  --region us-west-2 \
  --function-name DeleteCopies \
  --zip-file fileb://deletecopies/DeleteCopies.zip \
  --role arn:aws:iam::263315382302:role/executionrole \
  --handler DeleteCopies.handler \
  --runtime nodejs \
  --timeout 10 \
  --memory-size 1024 \
  --profile leisure
