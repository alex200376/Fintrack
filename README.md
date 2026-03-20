# Fintrack — Personal Finance Mobile App

A sleek, production-ready iOS/Android mobile app for tracking income, expenses, budgets, and financial reports. Built with **Expo React Native** and a polished UI.

## Features

### 📊 Dashboard
- Balance card with gradient themes or custom photo background
- Income/expense quick stats
- Recent transactions overview
- Quick access to add transactions

### 💳 Transaction Management
- Add, view, and delete transactions (income/expense)
- Categorize with custom icons and colors
- Search and filter by category
- Transaction details with edit functionality
- FlatList-optimized performance

### 💰 Budget Management
- Set budgets by category
- Period selection (weekly, monthly, yearly)
- Gradient summary card with visual status
- Track spending vs. budget limits
- Quick budget creation from dashboard

### 📈 Reports
- Income vs. Expenses bar chart
- Monthly breakdown with totals
- Savings rate calculation
- Best and worst spending months
- 3M / 6M / 12M time range toggles

### ⚙️ Customization
- **Custom Categories**: Create expense/income/both categories with 25 icon options and 24 color swatches
- **Avatar**: Choose emoji or upload a photo
- **Card Background**: Pick from 10 gradient themes or upload a custom photo
- **Currency**: Support for 10+ currencies (USD, EUR, GBP, JPY, KRW, INR, AUD, CAD, CHF, BTC)
- **Profile Storage**: All preferences saved locally with AsyncStorage

### 💾 Data Management
- **Export**: One-tap JSON export of all transactions, budgets, and categories
- **Import**: Restore data from a previous export file
- Web and native platform support

## Tech Stack

- **React Native** + Expo (iOS/Android development)
- **TypeScript** for type safety
- **Expo Router** for navigation
- **Context API** for state management (FinanceContext, ProfileContext)
- **SQLite** (via `expo-sqlite`) for local data persistence
- **Linear Gradient** for card themes
- **Expo Image Picker** for avatar/photo selection
- **Expo File System** + **Expo Sharing** for data export/import
- **Inter Font** from Google Fonts for typography

## Installation & Setup

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- Expo CLI (`pnpm add -g expo-cli`)

### Clone & Install
```bash
git clone <repo-url>
cd <repo-folder>
pnpm install
```

### Run on iOS/Android
```bash
cd artifacts/mobile
pnpm run dev
```

Then:
- **iOS**: Scan QR code with Camera app (or `Press i` in Expo CLI)
- **Android**: Scan QR code with Expo Go app (or `Press a` in Expo CLI)
- **Web**: Press `w` for web preview

## Project Structure

```
artifacts/mobile/
├── app/
│   ├── (tabs)/              # Tab navigator screens
│   │   ├── _layout.tsx      # Tab routing & bottom nav
│   │   ├── index.tsx        # Dashboard
│   │   ├── transactions.tsx # Transaction list & search
│   │   ├── budgets.tsx      # Budget management
│   │   ├── reports.tsx      # Reports & charts
│   │   ├── account.tsx      # Profile, settings, export/import
│   │   └── settings.tsx     # (Deprecated, moved to categories.tsx)
│   ├── _layout.tsx          # Root navigator
│   ├── categories.tsx       # Manage custom categories (card modal)
│   ├── add-transaction.tsx  # Modal for new transactions
│   ├── add-budget.tsx       # Modal for new budgets
│   └── transaction-detail.tsx # Transaction details & edit
├── context/
│   ├── FinanceContext.tsx   # Finance state (transactions, budgets, categories)
│   └── ProfileContext.tsx   # User profile state (name, avatar, currency, etc.)
├── hooks/
│   └── useTheme.ts          # Color scheme (light/dark mode)
├── components/
│   └── ErrorBoundary.tsx    # Error handling
├── constants/
│   ├── colors.ts            # Theme colors (light/dark)
│   └── theme.ts             # Spacing, radius, typography
└── app.json                 # Expo config
```

## Key Features Explained

### Custom Categories
- Access via **Account → Manage Categories**
- Choose from 25 Ionicons
- 24 color swatches
- Type: Expense, Income, or Both
- Used across all screens (Transactions, Budgets, Reports)

### Data Export/Import
- **Export**: Account → Data → Export Data
  - Creates a JSON file with all your data
  - Share or save to your device
  - Works on iOS, Android, and Web
- **Import**: Account → Data → Import Data
  - Select a previously exported JSON file
  - Confirms import count before proceeding
  - Restores categories, transactions, and budgets

### Card Themes
- 10 built-in gradient themes (purple, blue, teal, orange, pink, etc.)
- Upload a custom photo to use as balance card background
- Auto-applies dark overlay for text readability

## Navigation

- **Home** (Dashboard) → Quick overview, recent transactions
- **Transactions** → Full transaction history, search, add new
- **Budgets** → Budget overview, set limits, track spending
- **Reports** → Charts, savings analysis, monthly breakdown
- **Account** → Profile, preferences, categories, data management

## Database Schema

### Transactions
```
id | amount | type | categoryId | note | date | createdAt
```

### Budgets
```
id | categoryId | amount | period | createdAt
```

### Categories
```
id | name | icon | color | type | isDefault | createdAt
```

## Platform Support

- ✅ **iOS 13+** (via Expo Go or custom development build)
- ✅ **Android 8+** (via Expo Go or custom development build)
- ✅ **Web** (basic support for testing)

## Environment Variables

```env
# Optional: API endpoint for backend (if extending to cloud sync)
EXPO_PUBLIC_API_URL=http://your-api-url
```

## Hosting Options

### Option 1: Replit (Recommended for Development)
The app is already hosted on Replit with live preview. Share the Replit link with collaborators.

### Option 2: Cloudflare (Web Version)
The **web version** of Fintrack can be hosted on **Cloudflare Pages**:

1. **Build for web**:
   ```bash
   cd artifacts/mobile
   pnpm run build:web
   ```

2. **Deploy to Cloudflare Pages**:
   ```bash
   pnpm install -g wrangler
   wrangler pages deploy dist
   ```

3. Or connect your Git repo to Cloudflare for automatic deployments.

**Note**: The primary app is a mobile-first Expo app. The web build is for testing only and lacks full mobile features (camera, file system, haptics).

### Option 3: App Store & Google Play (Production)
To publish native apps:

**iOS App Store**:
```bash
eas build --platform ios
eas submit --platform ios
```

**Google Play**:
```bash
eas build --platform android
eas submit --platform android
```

Requires:
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)
- Expo account (free tier available)

See [Expo Deploy Documentation](https://docs.expo.dev/deploy/submit-to-app-stores/) for details.

## Development

### Adding a New Feature
1. Create a new screen in `app/(tabs)/newfeature.tsx`
2. Add state to `FinanceContext` or `ProfileContext`
3. Register in `app/(tabs)/_layout.tsx` for tab screens
4. Test on iOS, Android, and Web

### Debugging
- **Console logs**: Visible in Expo CLI
- **React DevTools**: Press `j` in Expo CLI
- **Network inspector**: Available in Expo CLI

### Styling
- Use `useTheme()` hook for color consistency
- Spacing/radius constants in `constants/theme.ts`
- Dark mode automatically applied based on system settings

## Data Privacy

- ✅ **All data stored locally** on device (SQLite)
- ✅ **No cloud sync** (intentional for privacy)
- ✅ **Export/import** for manual backup control
- ✅ **No tracking or analytics**

## License

MIT (or your preferred license)

## Troubleshooting

### App won't load
- Clear Expo cache: `expo start --clear`
- Check logs: `pnpm run dev` and look for errors

### Export not working
- Ensure file system permissions are granted
- On web, check browser console for errors
- Try import/export cycle to verify data persistence

### Photos not loading
- iOS: Grant photo library permission in Settings → Fintrack
- Android: Grant storage permission in Settings → Apps → Fintrack

## Contributing

Pull requests welcome! Please:
1. Test on iOS and Android
2. Follow existing code style
3. Update this README if adding features

---

**Fintrack** — Take control of your finances, one transaction at a time. 💰
