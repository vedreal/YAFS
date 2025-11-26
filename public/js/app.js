const CONFIG = {
  API_BASE_URL: window.location.origin,
  ADSGRAM_BLOCK_ID: '18274',
  CLAIM_COOLDOWN: 24 * 60 * 60 * 1000,
};

let userData = {
  id: null,
  username: 'Guest',
  firstName: 'User',
  totalCoins: 0,
  lastClaim: null,
  initData: null,
};

let AdController = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await simulateLoading();
  initTelegram();
  initAdsgram();
  await loadUserData();
  updateUI();
  setupEventListeners();
  hideLoadingScreen();
  startCountdownTimer();
}

function simulateLoading() {
  return new Promise((resolve) => {
    const progressBar = document.querySelector('.loading-progress');
    const percentText = document.querySelector('.loading-percent');
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(resolve, 500);
      }
      progressBar.style.width = `${progress}%`;
      percentText.textContent = `${Math.floor(progress)}%`;
    }, 200);
  });
}

function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#1e3a8a');
    tg.setBackgroundColor('#1e3a8a');

    userData.initData = tg.initData;

    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      userData.id = user.id.toString();
      userData.username = user.username || user.first_name || 'User';
      userData.firstName = user.first_name || 'User';
    } else {
      userData.id = 'demo_' + Math.random().toString(36).substr(2, 9);
      userData.username = 'Demo User';
      userData.firstName = 'Demo';
    }
  } else {
    userData.id = 'demo_' + Math.random().toString(36).substr(2, 9);
    userData.username = 'Demo User';
    userData.firstName = 'Demo';
  }
}

function initAdsgram() {
  try {
    if (window.Adsgram) {
      AdController = window.Adsgram.init({ blockId: CONFIG.ADSGRAM_BLOCK_ID });
    }
  } catch (error) {
    console.log('Adsgram not available:', error);
  }
}

async function loadUserData() {
  try {
    let url = `${CONFIG.API_BASE_URL}/api/user?id=${userData.id}`;
    if (userData.initData) {
      url += `&init_data=${encodeURIComponent(userData.initData)}`;
    }
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data) {
        userData.totalCoins = data.total_coins || 0;
        userData.lastClaim = data.last_claim ? new Date(data.last_claim).getTime() : null;
      }
    }
  } catch (error) {
    console.log('Could not load user data:', error);
  }
}

function updateUI() {
  document.getElementById('avatar-letter').textContent = userData.firstName.charAt(0).toUpperCase();
  document.getElementById('username').textContent = userData.username;
  document.getElementById('coin-balance').textContent = formatNumber(userData.totalCoins);
  updateClaimButton();
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function updateClaimButton() {
  const claimBtn = document.getElementById('claim-btn');
  const timerSection = document.getElementById('timer-section');

  if (canClaim()) {
    claimBtn.disabled = false;
    claimBtn.querySelector('.btn-text').textContent = 'CLAIM FREE BOX';
    timerSection.classList.add('hidden');
  } else {
    claimBtn.disabled = true;
    claimBtn.querySelector('.btn-text').textContent = 'CLAIMED';
    timerSection.classList.remove('hidden');
  }
}

function canClaim() {
  if (!userData.lastClaim) return true;
  const now = Date.now();
  return now - userData.lastClaim >= CONFIG.CLAIM_COOLDOWN;
}

function getTimeRemaining() {
  if (!userData.lastClaim) return 0;
  const now = Date.now();
  const elapsed = now - userData.lastClaim;
  return Math.max(0, CONFIG.CLAIM_COOLDOWN - elapsed);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startCountdownTimer() {
  setInterval(() => {
    const remaining = getTimeRemaining();
    document.getElementById('countdown').textContent = formatTime(remaining);

    if (remaining === 0) {
      updateClaimButton();
    }
  }, 1000);
}

function setupEventListeners() {
  document.getElementById('claim-btn').addEventListener('click', handleClaimClick);
  document.getElementById('close-modal').addEventListener('click', closeRewardModal);
  document.getElementById('mystery-box').addEventListener('click', handleClaimClick);
  document.getElementById('share-referral-btn').addEventListener('click', shareReferralLink);
  document.getElementById('referral-history-btn').addEventListener('click', showReferralHistory);
  document.getElementById('close-referral-modal').addEventListener('click', closeReferralModal);
}

async function handleClaimClick() {
  if (!canClaim()) {
    showError('Please wait for the cooldown!');
    return;
  }

  const claimBtn = document.getElementById('claim-btn');
  claimBtn.disabled = true;

  try {
    if (AdController) {
      await showAdAndClaim();
    } else {
      await claimReward();
    }
  } catch (error) {
    console.error('Claim error:', error);
    showError('Something went wrong. Try again!');
    claimBtn.disabled = false;
  }
}

async function showAdAndClaim() {
  try {
    const result = await AdController.show();
    if (result.done) {
      await claimReward();
    } else {
      showError('Watch the ad to claim your reward!');
      document.getElementById('claim-btn').disabled = false;
    }
  } catch (error) {
    console.log('Ad error, proceeding with claim:', error);
    await claimReward();
  }
}

async function claimReward() {
  const mysteryBox = document.getElementById('mystery-box');
  mysteryBox.classList.add('opening');

  try {
    const requestBody = { user_id: userData.id };
    if (userData.initData) {
      requestBody.init_data = userData.initData;
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    setTimeout(() => {
      mysteryBox.classList.remove('opening');

      if (data.ok) {
        const reward = data.reward;
        userData.totalCoins = data.total_coins || (userData.totalCoins + reward);
        userData.lastClaim = Date.now();

        showRewardModal(reward);
        updateUI();
      } else {
        showError(data.message || 'Could not claim reward. Try again!');
        document.getElementById('claim-btn').disabled = false;
      }
    }, 1000);
  } catch (error) {
    mysteryBox.classList.remove('opening');
    showError('Connection error. Please check your internet and try again!');
    document.getElementById('claim-btn').disabled = false;
  }
}

function showRewardModal(reward) {
  const modal = document.getElementById('reward-modal');
  document.getElementById('reward-value').textContent = reward;
  modal.classList.remove('hidden');

  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
  }
}

function closeRewardModal() {
  const modal = document.getElementById('reward-modal');
  modal.classList.add('hidden');
}

function showError(message) {
  const toast = document.getElementById('error-toast');
  const messageEl = document.getElementById('error-message');
  messageEl.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  const mainApp = document.getElementById('main-app');

  loadingScreen.style.opacity = '0';
  loadingScreen.style.transition = 'opacity 0.5s ease';

  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
  }, 500);
}

function shareReferralLink() {
  if (!userData.id) {
    showError('User not loaded yet!');
    return;
  }

  const referralUrl = `https://t.me/Yafscoin_bot/app?startapp=ref_${userData.id}`;
  const shareText = `Join YAFS Daily Claim! Get 50 $YAFS bonus when you use my referral link! 🎁`;

  if (window.Telegram && window.Telegram.WebApp) {
    if (navigator.share) {
      navigator.share({
        title: 'YAFS Referral',
        text: shareText,
        url: referralUrl
      }).catch(err => console.log('Share cancelled'));
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(referralUrl).then(() => {
          showError('Referral link copied to clipboard! 📋');
        });
      }
    }
  } else {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl).then(() => {
        showError('Referral link copied! 📋');
      });
    }
  }
}

async function showReferralHistory() {
  if (!userData.id) {
    showError('User not loaded yet!');
    return;
  }

  const modal = document.getElementById('referral-modal');
  const referralList = document.getElementById('referral-list');

  modal.classList.remove('hidden');
  referralList.innerHTML = '<p class="no-referrals">Loading...</p>';

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/referral?referrer_id=${userData.id}&init_data=${encodeURIComponent(userData.initData)}`);
    const data = await response.json();

    if (data.ok && data.referrals && data.referrals.length > 0) {
      referralList.innerHTML = data.referrals.map(ref => `
        <div class="referral-item">
          <div class="referral-name">User ${ref.referred_user_id.substring(0, 8)}</div>
          <div class="referral-bonus">+50 $YAFS</div>
          <div style="font-size: 10px; margin-top: 4px; color: var(--accent-blue);">
            ${new Date(ref.created_at).toLocaleDateString()}
          </div>
        </div>
      `).join('');
    } else {
      referralList.innerHTML = '<p class="no-referrals">No referrals yet. Share your link to earn! 🎁</p>';
    }
  } catch (error) {
    console.error('Fetch referrals error:', error);
    referralList.innerHTML = '<p class="no-referrals">Error loading referrals</p>';
  }
}

function closeReferralModal() {
  const modal = document.getElementById('referral-modal');
  modal.classList.add('hidden');
}
