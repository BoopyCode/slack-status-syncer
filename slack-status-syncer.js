#!/usr/bin/env node

// Slack Status Syncer - Because pretending to be available is the real work
// This tool syncs your Slack status with your focus level (or lack thereof)

const fs = require('fs');
const https = require('https');

// Configuration - Edit these before running
const CONFIG = {
  slackToken: 'YOUR_SLACK_TOKEN_HERE', // Find at api.slack.com/apps
  statusText: 'Deep in the code mines', // Your "do not disturb" message
  statusEmoji: ':robot_face:', // The emoji that screams "I'm busy"
  statusDuration: 60, // Minutes until Slack stops judging you
  checkInterval: 300000 // Check every 5 minutes (in milliseconds)
};

// Check if we're "working" (always returns true because we're developers)
function isActuallyWorking() {
  // Advanced heuristic: Are we awake? Probably working.
  const hour = new Date().getHours();
  return hour >= 9 && hour <= 17; // Magic "work hours" window
}

// Update Slack status with our current "focus"
function updateSlackStatus(isBusy) {
  const status = isBusy ? {
    status_text: CONFIG.statusText,
    status_emoji: CONFIG.statusEmoji,
    status_expiration: Math.floor(Date.now() / 1000) + (CONFIG.statusDuration * 60)
  } : {
    status_text: '',
    status_emoji: '',
    status_expiration: 0
  };

  const data = JSON.stringify({ profile: status });
  
  const options = {
    hostname: 'slack.com',
    path: '/api/users.profile.set',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${CONFIG.slackToken}`,
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let response = '';
    res.on('data', (chunk) => response += chunk);
    res.on('end', () => {
      const result = JSON.parse(response);
      if (result.ok) {
        console.log(`✅ Status updated: ${isBusy ? 'Busy' : 'Available'} (Slack believes you)`);
      } else {
        console.log(`❌ Slack said: ${result.error}`);
      }
    });
  });

  req.on('error', (err) => {
    console.log(`💀 Request failed: ${err.message}`);
  });

  req.write(data);
  req.end();
}

// Main loop - Because checking once is for quitters
function main() {
  console.log('🚀 Slack Status Syncer started (Your productivity theater begins)');
  
  if (CONFIG.slackToken === 'YOUR_SLACK_TOKEN_HERE') {
    console.log('⚠️  Please edit the script and add your Slack token first!');
    process.exit(1);
  }

  // Initial check
  updateSlackStatus(isActuallyWorking());
  
  // Keep checking forever (or until you remember to turn it off)
  setInterval(() => {
    updateSlackStatus(isActuallyWorking());
  }, CONFIG.checkInterval);
}

// Let's pretend we'll remember to run this
main();
