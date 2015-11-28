aws lambda invoke \
  --invocation-type Event \
  --function-name ProcessImages \
  --region us-west-2 \
  --payload file://input.txt \
  --profile leisure \
outputfile.txt
