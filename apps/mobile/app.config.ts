import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import type { ExpoConfig } from 'expo/config';

const rootEnvPath = resolve(__dirname, '../../.env');

config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined
});

const expoConfig: ExpoConfig = {
  name: 'Cato',
  slug: 'cato',
  scheme: 'cato',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.cato.poc',
    supportsTablet: false
  },
  android: {
    package: 'com.cato.poc'
  },
  plugins: ['expo-router']
};

export default expoConfig;
