# Tournament Email Notifications - Vercel Deployment Guide

This guide explains how to deploy the tournament notification system to Vercel for fully automated operation without any manual intervention.

## Overview

The system will:
- Run automatically every 5 minutes using Vercel's cron jobs
- Check for tournaments scheduled to start in 20 minutes
- Send email notifications to tournament hosts
- Mark notifications as sent to prevent duplicates

## Step 1: Set Up Environment Variables

In your Vercel project, add these environment variables:

1. **Firebase Configuration:**
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

2. **Email Configuration:**
   - `EMAIL_USER` - Your Gmail address
   - `EMAIL_PASSWORD` - Your Gmail app password

3. **API Security (Optional):**
   - `API_KEY` - Create a random string to secure your API endpoint

You can copy values from the `env.example` file, rename it to `.env` for local development, and add your actual values.

To add environment variables to Vercel:
1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add each variable with its value
4. Make sure to select all environments (Production, Preview, Development)

## Step 2: Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Deploy your project

Vercel will automatically:
- Build your application
- Set up the API endpoint
- Configure the cron job to run every 5 minutes

## Step 3: Verify the Deployment

After deploying:

1. Check the deployment logs to make sure the build was successful
2. Test the API endpoint manually:
   - Visit: `https://your-vercel-domain.vercel.app/api/tournament-notifications`
   - You should see a JSON response with the results

## How It Works

1. **Cron Job**: Vercel's built-in cron scheduler calls the `/api/tournament-notifications` endpoint every 5 minutes.
2. **API Endpoint**: The serverless function in `api/tournament-notifications.js` runs when called.
3. **Tournament Check**: The function checks Firestore for tournaments starting in 20 minutes.
4. **Email Sending**: If tournaments are found, emails are sent to the hosts.
5. **Database Update**: The tournament documents are updated to mark notifications as sent.

## Monitoring

You can monitor the system in your Vercel dashboard:

1. Go to your Vercel project
2. Click on "Functions" to see execution logs
3. Click on "Cron Jobs" to see the cron job status and history

## Required Firestore Index

For the system to work properly, you need this Firestore index:
- Collection: `tournaments`
- Fields to index:
  - `status` (Ascending)
  - `start_date` (Ascending)

You'll get a direct link to create the index if it's missing when the function first runs.

## Troubleshooting

If emails are not being sent:
1. Check Vercel function logs for errors
2. Verify environment variables are set correctly
3. Make sure your Gmail account allows "less secure apps" or is properly configured for app passwords
4. Ensure the Firestore index is created and active 