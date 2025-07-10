#!/bin/bash

# This is a filter script for git filter-branch
# It replaces sensitive credentials with placeholders

# Private key pattern to search for
private_key_pattern='-----BEGIN PRIVATE KEY-----[^-]*-----END PRIVATE KEY-----'
credential_object_pattern='"type": "service_account",[^}]*"private_key": "[^"]*",[^}]*'

# Check if file is one we want to modify
filename="$1"
if [[ "$filename" == *create-automatic-test-tournament.js || 
      "$filename" == *create-fully-automatic-tournament.js || 
      "$filename" == *create-immediate-notification-tournament.js || 
      "$filename" == *create-second-test-tournament.js || 
      "$filename" == *update-tournament-time.js || 
      "$filename" == *create-test-data-admin.js ]]; then
    
    # Replace private key with placeholder
    perl -pe "s|$private_key_pattern|-----BEGIN PRIVATE KEY-----\nREDACTED_PRIVATE_KEY\n-----END PRIVATE KEY-----|gs" |
    
    # Replace credential object with placeholder structure
    perl -pe "s|$credential_object_pattern|\"type\": \"service_account\", \"project_id\": \"project-id-redacted\", \"private_key\": \"REDACTED\", \"client_email\": \"redacted@example.com\", \"client_id\": \"redacted\",|gs"
else
    # Don't modify other files
    cat
fi
