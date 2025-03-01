#!/bin/bash

if [ "$1" = "staging" ]; then
    railway link your_staging_project_id
    echo "Switched to staging environment"
elif [ "$1" = "prod" ]; then
    railway link your_prod_project_id
    echo "Switched to production environment"
else
    echo "Please specify 'staging' or 'prod'"
fi 