# YAFS - Telegram Mini-App Daily Free Box

## Overview
YAFS is a Telegram Mini-App that allows users to claim daily free box rewards (10-100 YAFS coins every 24 hours). The app features a premium pixel-art 3D design with blue-white gradient theme, modern animations, and Adsgram integration for rewarded ads.

## Project Architecture

### Frontend (public/)
- `public/index.html` - Main HTML with loading screen and reward modal
- `public/css/style.css` - Premium pixel-art 3D styling with blue-white gradient
- `public/js/app.js` - Frontend JavaScript with Telegram SDK and Adsgram integration (Block ID: 18273)

### Backend (Vercel Serverless - NO Express!)
- `api/reward.js` - GET/POST endpoint for claiming daily reward (supports Adsgram callback)
- `api/user.js` - GET endpoint for fetching user data
- `supabaseClient.js` - Supabase connection helper

### Configuration
- `package.json` - Dependencies (only @supabase/supabase-js, serve)
- `vercel.json` - Vercel deployment configuration
- `.gitignore` - Git ignore rules

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS with Telegram Mini-App SDK
- **Backend**: Vercel Serverless Functions (Node.js 18+) - NO EXPRESS
- **Database**: Supabase (PostgreSQL)
- **Ads**: Adsgram SDK for rewarded ads (Test Platform - Block ID 18273)
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
8. Adsgram rewarded ads integration (Test mode currently - shows "No ads" message)
9. Haptic feedback on Telegram
10. Security: Telegram initData HMAC-SHA256 verification, 5-minute auth_date freshness check

## Deployment Status
✅ **Production Ready!**
- Deployed at: https://yafs-neon.vercel.app
- GitHub connected for auto-deployment
- All environment variables configured
- Adsgram Block ID 18273 (Test Platform) active

## Recent Changes (November 26, 2025)
- Fixed API to accept GET requests from Adsgram callbacks
- Updated Adsgram Block ID to 18273 (test platform - no ads shown, but full API integration working)
- Verified reward system working (coins successfully added on test)
- App is 100% production-ready for launch
- Next step: Wait for Adsgram production block approval for real ads to display
