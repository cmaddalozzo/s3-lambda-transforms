#!/bin/bash
BASE=$PWD
rm -rf ${BASE}/dist/*
cd ${BASE}/processimages && zip -r ${BASE}/dist/ProcessImages.zip ../lambdaConfig.json *
cd ${BASE}/deletecopies && zip -r ${BASE}/dist/DeleteCopies.zip ../lambdaConfig.json * 
cd ${BASE}
aws lambda update-function-code \
  --function-name ProcessImages \
  --zip-file fileb://dist/ProcessImages.zip
aws lambda update-function-code \
  --function-name DeleteCopies \
  --zip-file fileb://dist/DeleteCopies.zip
