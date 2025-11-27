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

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (req.method === 'GET') {
    const referrerId = req.query.referrer_id;
    const initData = req.query.init_data;

    if (!referrerId) {
      return res.status(400).json({ error: 'Missing referrer_id' });
    }

    const isDemoUser = referrerId?.startsWith('demo_');
    let verifiedReferrerId = null;

    if (isDemoUser) {
      verifiedReferrerId = referrerId;
    } else if (!botToken) {
      return res.status(503).json({ error: 'Server configuration error' });
    } else if (initData) {
      const verifiedUser = verifyTelegramWebAppData(initData, botToken);
      if (verifiedUser) {
        verifiedReferrerId = verifiedUser.id.toString();
      }
    }

    if (!verifiedReferrerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', verifiedReferrerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        ok: true,
        referrals: referrals || []
      });
    } catch (error) {
      console.error('Fetch referrals error:', error);
      return res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  }

  if (req.method === 'POST') {
    const { referrer_id, referred_user_id, init_data } = req.body;

    if (!referrer_id || !referred_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prevent self-referral
    if (referrer_id === referred_user_id) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    const isDemoReferrer = referrer_id?.startsWith('demo_');
    let verifiedReferrerId = null;

    if (isDemoReferrer) {
      verifiedReferrerId = referrer_id;
    } else if (!botToken) {
      return res.status(503).json({ error: 'Server configuration error' });
    } else if (init_data) {
      const verifiedUser = verifyTelegramWebAppData(init_data, botToken);
      if (verifiedUser && verifiedUser.id.toString() === referred_user_id) {
        verifiedReferrerId = referrer_id;
      } else {
        return res.status(401).json({ error: 'Authentication required' });
      }
    }

    if (!verifiedReferrerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Check if referral already exists
      const { data: existingReferral, error: checkError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrer_id)
        .eq('referred_user_id', referred_user_id)
        .maybeSingle();

      if (existingReferral) {
        return res.status(400).json({ error: 'Already referred this user' });
      }

      // Record the referral
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_id,
          referred_user_id,
          bonus_amount: 50,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Add bonus coins to referrer
      const { data: referrerUser, error: fetchReferrerError } = await supabase
        .from('users')
        .select('total_coins')
        .eq('id', referrer_id)
        .maybeSingle();

      if (fetchReferrerError) throw fetchReferrerError;

      const currentCoins = referrerUser?.total_coins || 0;
      const newCoins = currentCoins + 50;

      const { error: updateError } = await supabase
        .from('users')
        .update({ total_coins: newCoins })
        .eq('id', referrer_id);

      if (updateError) throw updateError;

      return res.status(200).json({
        ok: true,
        message: 'Referral recorded successfully! +50 $YAFS awarded!',
        bonus: 50
      });
    } catch (error) {
      console.error('Add referral error:', error);
      return res.status(500).json({ error: 'Failed to record referral' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
