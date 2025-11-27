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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, init_data } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  const isDemoUser = user_id?.startsWith('demo_');
  let verifiedUserId = null;

  if (isDemoUser) {
    verifiedUserId = user_id;
  } else if (!botToken) {
    return res.status(503).json({ error: 'Server configuration error' });
  } else if (init_data) {
    const verifiedUser = verifyTelegramWebAppData(init_data, botToken);
    if (verifiedUser) {
      verifiedUserId = verifiedUser.id.toString();
    } else {
      return res.status(401).json({ error: 'Invalid authentication' });
    }
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', verifiedUserId)
      .single();

    const now = Date.now();
    const MINING_COOLDOWN = 2 * 60 * 60 * 1000;

    if (existingUser) {
      if (existingUser.last_mining) {
        const lastMiningTime = new Date(existingUser.last_mining).getTime();
        if (now - lastMiningTime < MINING_COOLDOWN) {
          const remaining = MINING_COOLDOWN - (now - lastMiningTime);
          const hours = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          return res.json({
            ok: false,
            message: `Come back in ${hours}h ${minutes}m!`,
            next_mining_time: lastMiningTime + MINING_COOLDOWN
          });
        }
      }

      const reward = 5;
      const newTotal = (existingUser.total_coins || 0) + reward;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_mining: new Date().toISOString(),
          total_coins: newTotal
        })
        .eq('id', verifiedUserId);

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Failed to claim mining' });
      }

      return res.json({
        ok: true,
        reward: reward,
        total_coins: newTotal,
        message: 'Mining claimed successfully!',
        next_mining_time: Date.now() + MINING_COOLDOWN
      });
    } else {
      const reward = 5;

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: verifiedUserId,
          last_mining: new Date().toISOString(),
          total_coins: reward,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      return res.json({
        ok: true,
        reward: reward,
        total_coins: reward,
        message: 'Welcome! First mining claimed!',
        next_mining_time: Date.now() + MINING_COOLDOWN
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
