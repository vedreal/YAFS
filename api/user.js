import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
);

const MAX_AUTH_AGE_SECONDS = 300;

function verifyTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return null;
  
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;
    
    const authDate = urlParams.get('auth_date');
    if (!authDate) return null;
    
    const authTimestamp = parseInt(authDate, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - authTimestamp > MAX_AUTH_AGE_SECONDS) {
      console.log('Auth data expired:', currentTimestamp - authTimestamp, 'seconds old');
      return null;
    }
    
    urlParams.delete('hash');
    const entries = Array.from(urlParams.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) return null;
    
    const userStr = urlParams.get('user');
    if (!userStr) return null;
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Verification error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  const initData = req.query.init_data;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!id) {
    return res.status(400).json({ error: 'Missing user id' });
  }

  const isDemoUser = id?.startsWith('demo_');
  let verifiedUserId = null;

  if (isDemoUser) {
    verifiedUserId = id;
  } else if (!botToken) {
    return res.status(503).json({ 
      error: 'Server configuration error',
      message: 'Authentication service unavailable. Please contact support.'
    });
  } else if (initData) {
    const verifiedUser = verifyTelegramWebAppData(initData, botToken);
    if (verifiedUser) {
      verifiedUserId = verifiedUser.id.toString();
    } else {
      return res.status(401).json({ error: 'Invalid authentication' });
    }
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', verifiedUserId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!data) {
      return res.json({
        id: verifiedUserId,
        total_coins: 0,
        last_claim: null,
        next_claim_time: null,
        created_at: null
      });
    }

    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const nextClaimTime = data.last_claim 
      ? new Date(data.last_claim).getTime() + COOLDOWN_MS
      : null;
    
    const MINING_COOLDOWN_MS = 2 * 60 * 60 * 1000;
    const nextMiningTime = data.last_mining 
      ? new Date(data.last_mining).getTime() + MINING_COOLDOWN_MS
      : null;
    
    return res.json({
      id: data.id,
      total_coins: data.total_coins || 0,
      last_claim: data.last_claim,
      next_claim_time: nextClaimTime,
      last_mining: data.last_mining,
      next_mining_time: nextMiningTime,
      created_at: data.created_at
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
