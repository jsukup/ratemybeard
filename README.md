# RateMyFeet - Full-Stack Monorepo

A complete monorepo implementation of RateMyFeet with web and mobile applications sharing business logic through a common package.

## 🏗️ Architecture

```
ratemyfeet/
├── web/                    # Next.js web application
├── mobile/                 # React Native + Expo mobile app  
├── shared/                 # Shared business logic and types
├── MOBILE_DEPLOYMENT.md    # Mobile deployment guide
└── README.md              # This file
```

### Technology Stack

**Web Application (Next.js)**
- Next.js 15.2.2 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI components
- Vercel deployment

**Mobile Application (React Native + Expo)**
- Expo 53.0.20 with managed workflow
- React Native 0.79.5
- React Navigation for navigation
- Expo Camera for image capture
- AsyncStorage for session management
- EAS Build for deployment

**Shared Package**
- TypeScript compilation target
- Supabase client abstraction
- Session management utilities
- Validation schemas (Zod)
- Image optimization utilities
- Rating calculation logic

**Backend**
- Supabase for database and storage
- PostgreSQL with Row Level Security
- Real-time subscriptions
- Automatic image storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17.0+ 
- npm 8.0.0+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/jsukup/ratemyfeet.git
cd ratemyfeet

# Install all dependencies (installs for all workspaces)
npm install

# This automatically builds the shared package
```

### Development

```bash
# Start web development server
npm run dev:web
# Runs on http://localhost:3000

# Start mobile development server  
npm run dev:mobile
# Opens Expo developer tools
```

### Building

```bash
# Build all projects
npm run build

# Build individual projects
npm run build:web      # Next.js production build
npm run build:mobile   # React Native/EAS build
npm run build:shared   # TypeScript compilation
```

## 📱 Mobile Development

### Device Testing

**Expo Go (Development)**
```bash
npm run dev:mobile
# Scan QR code with Expo Go app
```

**Development Build (Full Features)**
```bash
npm run mobile:build:development
# Install on device for camera/storage testing
```

**Preview Build (Internal Testing)**
```bash
npm run mobile:build:preview
# Generate APK/IPA for testing
```

### Production Deployment

See [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) for detailed mobile deployment instructions.

## 🌐 Web Development

### Local Development
```bash
npm run dev:web
```

### Production Deployment
```bash
# Build for production
npm run build:web

# Deploy to Vercel (configured)
vercel --prod
```

## 📦 Shared Package

The shared package contains ~70% of business logic shared between web and mobile:

### Key Features
- **Supabase Client**: Platform-agnostic database client
- **Session Management**: Cross-platform session handling  
- **Validation**: Zod schemas for data validation
- **Image Optimization**: Responsive image utilities
- **Rating Logic**: Median calculation and categorization
- **Type Definitions**: Shared TypeScript interfaces

### Development Workflow

```bash
# Make changes to shared package
cd shared && npm run build

# Changes automatically available to web and mobile
npm run dev:web    # Uses updated shared package
npm run dev:mobile # Uses updated shared package  
```

## 🛠️ Development Commands

### Workspace Commands
```bash
# Work in specific workspace
npm run workspace:web -- <command>
npm run workspace:mobile -- <command>  
npm run workspace:shared -- <command>

# Example: Install package in web workspace
npm run workspace:web -- install lodash
```

### Quality Assurance
```bash
# Type checking across all projects
npm run type-check

# Linting with auto-fix
npm run lint:fix

# Run tests (when implemented)
npm run test
```

### Maintenance
```bash
# Clean all node_modules and reinstall
npm run fresh-install

# Clean build artifacts
npm run clean
```

## 🏛️ Project Structure

### Web Application (`/web/`)
```
web/
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   └── page.tsx          # Home page
├── components/           # React components
├── lib/                  # Utilities and configs
├── utils/               # Helper functions
└── constants/           # Application constants
```

### Mobile Application (`/mobile/`)
```
mobile/
├── src/
│   ├── components/      # React Native components
│   ├── screens/         # Navigation screens
│   ├── navigation/      # React Navigation setup
│   ├── services/        # API services
│   └── utils/           # Mobile utilities
├── App.tsx              # Root component
├── app.config.js        # Expo configuration
├── eas.json             # EAS Build configuration
└── metro.config.js      # Metro bundler config
```

### Shared Package (`/shared/`)
```
shared/
├── src/                 # Source TypeScript files
├── dist/                # Compiled JavaScript
├── constants/           # Shared constants
├── services/            # API services
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── tsconfig.json        # TypeScript config
```

## 🔧 Configuration

### Environment Variables

**Web Application (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Mobile Application (via app.config.js)**
```javascript
extra: {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
```

### Database Schema

The application uses these main tables:
- `images` - User uploaded images with metadata
- `ratings` - User ratings (0-10 scale)  
- `sessions` - Anonymous session tracking

## 🚢 Deployment

### Web Deployment (Vercel)
- Automatic deployment on push to main
- Environment variables configured in Vercel dashboard
- Custom domain: https://ratemyfeet.net

### Mobile Deployment (EAS)
- Development builds for testing
- Preview builds for internal testing
- Production builds for app stores
- See [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md)

## 📊 Monitoring

### Web Application
- Vercel Analytics for performance
- Error tracking through Vercel
- Core Web Vitals monitoring

### Mobile Application  
- Expo development tools
- EAS Build logs
- Crash reporting (configurable)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes in appropriate workspace(s)
4. Test across web and mobile: `npm run type-check`
5. Commit changes: `git commit -m "Add amazing feature"`
6. Push branch: `git push origin feature/amazing-feature`
7. Create Pull Request

### Code Standards
- TypeScript for all new code
- Shared business logic goes in `/shared/`
- Platform-specific UI in respective apps
- Follow existing patterns and conventions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check workspace-specific README files
- **Issues**: Report bugs via GitHub Issues
- **Mobile Deployment**: See [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md)
- **Web Deployment**: Check Vercel dashboard and logs

---

**Made with ❤️ using React, React Native, TypeScript, and Supabase**