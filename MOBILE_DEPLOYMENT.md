# RateMyBeard Mobile App Deployment Guide

## Prerequisites

1. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account**: Create account at https://expo.dev and login
   ```bash
   eas login
   ```

3. **Environment Variables**: Set up in Expo dashboard
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Development Builds

### Local Development
```bash
# Start development server
npm run dev:mobile

# Or from mobile directory
cd mobile && npm start
```

### Development Build (for device testing)
```bash
# Build development version
npm run mobile:build:development

# Or from mobile directory  
cd mobile && npm run build:development
```

## Preview Builds (Internal Testing)

### Android APK
```bash
# Build Android APK for internal testing
npm run mobile:build:preview

# Or build only Android
npm run mobile:build:android -- --profile preview
```

### iOS Build
```bash
# Build iOS for TestFlight
npm run mobile:build:ios -- --profile preview
```

## Production Builds

### Android (Google Play Store)
```bash
# Build AAB for Play Store
npm run mobile:build:android

# Submit to Play Store (requires service account JSON)
npm run mobile:submit:android
```

### iOS (App Store)
```bash
# Build for App Store
npm run mobile:build:ios

# Submit to App Store (requires Apple Developer account)
npm run mobile:submit:ios
```

## Build Profiles

### Development Profile
- **Purpose**: Testing on physical devices during development
- **Features**: Development client, fast refresh
- **Distribution**: Internal (via Expo Go or development build)

### Preview Profile  
- **Purpose**: Internal testing and stakeholder review
- **Features**: Production-like build without store optimization
- **Distribution**: Internal (APK/IPA files)

### Production Profile
- **Purpose**: App store submissions
- **Features**: Optimized, store-ready builds
- **Distribution**: Google Play Store / Apple App Store

## Environment Configuration

### Development
```javascript
// app.config.js - development
extra: {
  NEXT_PUBLIC_SUPABASE_URL: "https://dev-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "dev-key-here"
}
```

### Production
```javascript
// app.config.js - production  
extra: {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
```

## Shared Package Integration

The mobile app automatically uses the latest shared package build:

```bash
# Rebuild shared package when making changes
npm run build:shared

# Mobile app will use updated shared package on next start
npm run dev:mobile
```

## Testing Strategy

### Local Testing
1. **Expo Go**: Quick testing during development
2. **Development Build**: Full feature testing on device
3. **Web Preview**: Basic functionality testing in browser

### Device Testing
1. **Preview Builds**: Install APK/IPA on test devices
2. **TestFlight**: iOS beta testing through Apple
3. **Internal App Sharing**: Android beta testing through Google Play

## Deployment Checklist

### Before Building
- [ ] Test all shared package integrations
- [ ] Verify environment variables are set
- [ ] Run TypeScript compilation (`npm run type-check`)
- [ ] Test camera permissions on device
- [ ] Verify Supabase connection

### Android Deployment
- [ ] Update version in `app.config.js`
- [ ] Test on multiple Android versions (API 21+)
- [ ] Verify Google Play Console setup
- [ ] Upload service account key for submission

### iOS Deployment  
- [ ] Update version in `app.config.js`
- [ ] Test on multiple iOS versions (iOS 13+)
- [ ] Verify App Store Connect setup
- [ ] Configure Apple Developer account credentials

## Troubleshooting

### Common Issues

1. **Metro bundler cache**: Clear with `npx expo start --clear`
2. **Shared package not updating**: Run `npm run build:shared`
3. **TypeScript errors**: Check path mapping in `tsconfig.json`
4. **Build failures**: Verify EAS project setup with `eas build:configure`

### Performance Optimization

1. **Bundle analysis**: Use `npx expo install @expo/webpack-config`
2. **Image optimization**: Use Expo's image optimization
3. **Code splitting**: Implement lazy loading for screens
4. **Storage**: Monitor AsyncStorage usage

## Monitoring & Analytics

### Crash Reporting
- Configure Expo's error reporting
- Integrate Sentry for detailed crash reports

### Performance Monitoring
- Use Flipper for React Native debugging  
- Monitor bundle size and startup time
- Track user engagement metrics

## Security Considerations

### API Keys
- Never commit API keys to repository
- Use Expo's secure store for sensitive data
- Rotate keys regularly

### Data Protection
- Implement certificate pinning for production
- Validate all API responses
- Use HTTPS for all network requests

## Support

For deployment issues:
1. Check Expo documentation: https://docs.expo.dev/
2. Review EAS Build logs in Expo dashboard
3. Consult React Navigation docs for navigation issues
4. Check Supabase integration guides for backend issues