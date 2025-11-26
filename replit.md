# YAFS - Telegram Mini-App Daily Free Box

## Overview
YAFS is a Telegram Mini-App that allows users to claim daily free box rewards (10-100 YAFS coins every 24 hours). The app features a premium pixel-art 3D design with blue-white gradient theme, modern animations, and Adsgram integration for rewarded ads.

## Project Architecture

### Frontend (public/)
- `public/index.html` - Main HTML with loading screen and reward modal
- `public/css/style.css` - Premium pixel-art 3D styling with blue-white gradient
- `public/js/app.js` - Frontend JavaScript with Telegram SDK and Adsgram integration

### Backend (Vercel Serverless - NO Express!)
- `api/reward.js` - POST endpoint for claiming daily reward
- `api/user.js` - GET endpoint for fetching user data
- `supabaseClient.js` - Supabase connection helper

### Configuration
- `package.json` - Dependencies (only @supabase/supabase-js, serve)
- `vercel.json` - Vercel deployment configuration
- `.gitignore` - Git ignore rules

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS with Telegram Mini-App SDK
- **Backend**: Vercel Serverless Functions (Node.js 20.x) - NO EXPRESS
- **Database**: Supabase (PostgreSQL)
- **Ads**: Adsgram SDK for rewarded ads
- **Design**: Pixel-art 3D style, blue-white gradient, premium UI

## Supabase Table Schema
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  total_coins INTEGER DEFAULT 0,
  last_claim TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `TELEGRAM_BOT_TOKEN` - Your Telegram Bot token (for initData verification)

## Features
1. Premium loading screen with 3D rotating cube animation
2. User profile display (Telegram username + YAFS balance)
3. Daily free box claim with 24-hour cooldown
4. Random reward (10-100 YAFS coins)
5. Animated mystery box opening
6. Reward celebration modal with floating coins
7. Countdown timer showing next claim time
8. Adsgram rewarded ads integration
9. Haptic feedback on Telegram
10. Offline fallback with localStorage

## Deployment
Deploy to Vercel:
1. Connect your GitHub repository
2. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY)
3. Deploy!

## Recent Changes
- Initial project setup (November 2025)
- Created premium pixel-art 3D UI with blue-white gradient theme
- Implemented Vercel serverless functions (NO Express backend)
- Added Supabase integration for user data persistence
- Integrated Adsgram SDK for rewarded ads
