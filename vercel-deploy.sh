#!/bin/bash
# Pull vercel token from env if available
npx vercel deploy --prod \
  --yes \
  --name carry-finance \
  --scope tomalma-codes-projects \
  2>&1
