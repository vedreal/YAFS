# YAFS - Telegram Mini-App Daily Free Box

## Overview
YAFS is a Telegram Mini-App that allows users to claim daily free box rewards (10-100 YAFS coins every 24 hours) with referral system. The app features a premium pixel-art 3D design with blue-white gradient theme, modern animations, and Adsgram integration for rewarded ads.

## Project Architecture

### Frontend (public/)
- `public/index.html` - Main HTML with loading screen, reward modal, and referral section
- `public/css/style.css` - Premium pixel-art 3D styling with blue-white gradient
- `public/js/app.js` - Frontend JavaScript with Telegram SDK, Adsgram, and referral system

### Backend (Vercel Serverless - NO Express!)
- `api/reward.js` - GET/POST endpoint for claiming daily reward (supports Adsgram callback)
- `api/user.js` - GET endpoint for fetching user data
- `api/referral.js` - GET/POST endpoint for referral management (stores to Supabase)
- `api/mining.js` - POST endpoint for mining claims every 2 hours (5 $YAFS reward)
- `supabaseClient.js` - Supabase connection helper

### Configuration
- `package.json` - Dependencies (only @supabase/supabase-js, serve)
- `vercel.json` - Vercel deployment configuration
- `.gitignore` - Git ignore rules

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS with Telegram Mini-App SDK
- **Backend**: Vercel Serverless Functions (Node.js 18+) - NO EXPRESS
- **Database**: Supabase (PostgreSQL)
- **Ads**: Adsgram SDK for rewarded ads (Production Block ID 18274)
- **Design**: Pixel-art 3D style, blue-white gradient, premium UI

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  total_coins INTEGER DEFAULT 0,
  last_claim TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Referrals Table (NEW!)
```sql
CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  bonus_amount INTEGER DEFAULT 50,
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
8. Adsgram rewarded ads integration (Production block 18274 - real ads!)
9. **Referral System** - Share link, earn +50 $YAFS per valid referral
10. **Referral History** - View all successful referrals with dates
11. **Free Mining** - Claim 5 $YAFS every 2 hours (no animation)
12. Withdraw button (coming soon)
13. Haptic feedback on Telegram
14. Security: Telegram initData HMAC-SHA256 verification, 5-minute auth_date freshness check

## Referral System Flow
1. User clicks "SHARE REFERRAL" button
2. Generates link: `https://t.me/Yafscoinbot/app?startapp=ref_[user_id]`
3. Link copied to clipboard or shared via Telegram
4. Friend joins via referral link
5. Referral data stored in Supabase automatically
6. User gets +50 $YAFS bonus instantly
7. User can view referral history with "History" button (small clock icon)

## Deployment Status
✅ **Production Ready!**
- Deployed at: https://yafs-neon.vercel.app
- GitHub connected for auto-deployment
- All environment variables configured
- Adsgram Block ID 18274 (Production) - REAL ADS ACTIVE!
- Referral system fully integrated with Supabase

## Recent Changes (November 27, 2025)
- Reverted cooldown back to 24 hours per user request
- **NEW: Free Mining feature** - Claim 5 $YAFS every 2 hours
- Mining button shows "FREE MINING" for first-time, "CLAIM NOW" when ready
- Countdown timer shows when next mining will be available
- Mining claims do NOT trigger mystery box animation
- Both Daily Box (24h) and Mining (2h) working independently
