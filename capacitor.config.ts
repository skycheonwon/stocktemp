import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.templock.stocktemp',
  appName: 'StockTemp',
  webDir: 'dist',
  server: {
    url: 'https://stocktemp-c7d77.web.app',
    cleartext: true
  }
};

export default config;
