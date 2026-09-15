# NCHP FiveM Discord Setup Bot

This bot builds the North Carolina Highway Patrol FiveM Discord structure with one `/setup-nchp` command.

## What it creates
- NCHP rank roles from Colonel through Trooper Cadet
- High Command, Supervisor, FTO, K-9, Motor, Aviation, Criminal Interdiction, Internal Affairs, LOA and Inactive roles
- Information, Recruitment, Trooper Operations, Communications, Training, Special Operations, Supervisor, High Command and Community areas
- Text and voice channels
- Private Supervisor and High Command category permissions
- A roster post linking the NCHP Google Sheet

## Setup
1. Go to the Discord Developer Portal and create a New Application.
2. Open **Bot**, create/reset the bot token, and copy it.
3. Copy the **Application ID** from General Information.
4. Rename `.env.example` to `.env` and paste the token and Application ID.
5. In the Developer Portal under OAuth2 > URL Generator, select `bot` and `applications.commands`, then give the bot **Administrator** permission.
6. Use the generated invite link to add the bot to a blank Discord server you own/manage.
7. Install Node.js 18+.
8. In this folder run:
   npm install
   npm start
9. In your Discord server run:
   /setup-nchp

Do not share your `.env` or Discord bot token.
