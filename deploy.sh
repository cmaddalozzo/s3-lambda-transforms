#!/bin/bash
rm -rf dist/*
zip -r dist/ProcessImages.zip processimages/*
aws lambda update-function-code \
  --function-name ProcessImages \
  --zip-file fileb://dist/ProcessImages.zip
