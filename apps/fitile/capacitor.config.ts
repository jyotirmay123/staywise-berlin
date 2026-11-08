import type { CapacitorConfig } from '@capacitor/cli'

const config:CapacitorConfig={appId:'app.fittile.health',appName:'Fitile',webDir:'dist',server:{androidScheme:'https'},plugins:{Camera:{permissions:['camera','photos']},SplashScreen:{launchShowDuration:1200,backgroundColor:'#f2f3ed',showSpinner:false}}}
export default config
