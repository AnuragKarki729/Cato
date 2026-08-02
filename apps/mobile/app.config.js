const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { config } = require('dotenv');

const rootEnvPath = resolve(__dirname, '../../.env');

config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined
});

function getGoogleWebClientId() {
  if (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(process.env.GOOGLE_CLIENT_SECRET);
    return parsed?.web?.client_id;
  } catch (_error) {
    return undefined;
  }
}

module.exports = {
  name: 'Cato',
  slug: 'cato',
  scheme: 'cato',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.cato.poc',
    supportsTablet: false
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#111111',
      foregroundImage: './assets/adaptive-icon.png'
    },
    package: 'com.cato.poc',
    versionCode: 1
  },
  extra: {
    googleWebClientId: getGoogleWebClientId(),
    eas: {
      projectId: '8c6b942e-11cb-43e3-b6fc-9a2740c80fb4'
    }
  },
  plugins: ['expo-router']
};
