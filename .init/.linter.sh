#!/bin/bash
cd /home/kavia/workspace/code-generation/leftoverchef-smart-recipe--nutrition-hub-109529-b1c8fcee/frontend_web
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

