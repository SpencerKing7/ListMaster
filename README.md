# ListMaster PWA

🚀 **[See the deployed app here →](https://spencerking7.github.io/ListMaster/)**

ListMaster is a Progressive Web App (PWA) that serves as the web port of the ListMaster iOS app. It provides a mobile-first, iOS-feel interface for managing lists and categories, allowing users to organize their tasks and items efficiently.

## Features

- **Category Management**: Create, edit, and organize categories of lists.
- **Swipe Gestures**: Navigate between screens with horizontal swipe gestures.
- **Drag-to-Scroll Picker**: Smooth scrolling category picker with drag support.
- **Theme Support**: Light, dark, and system theme modes.
- **Onboarding Flow**: Guided setup for new users.
- **Persistent Storage**: Data saved locally using localStorage.
- **PWA Capabilities**: Installable on mobile devices, works offline.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui
- **Routing**: React Router v7 (HashRouter for PWA deployment)
- **State Management**: Zustand-style Context + useReducer stores
- **PWA**: vite-plugin-pwa
- **Gestures**: Pointer Events API for touch and mouse interactions

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ListMasterPWA
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173` (or the port shown in the terminal).

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Project Structure

The project follows a **feature-by-layer** folder convention:

- `src/App.tsx`: Root component with routing and providers
- `src/main.tsx`: React entry point
- `src/screens/`: Full-screen route components (e.g., MainScreen, SettingsSheet)
- `src/components/`: Reusable UI components (e.g., CategoryPicker, BottomBar)
- `src/store/`: Global state management with React Context + useReducer
- `src/services/`: Side-effectful services (e.g., persistence via localStorage)
- `src/models/`: TypeScript interfaces and types
- `src/lib/`: Pure utility functions
- `src/styles/`: CSS custom property tokens
- `src/assets/`: Static assets

## Development Notes

- **Mobile-First Design**: Optimized for mobile with safe-area insets for iOS notch/home indicator.
- **Gestures**: Uses Pointer Events for swipe and drag interactions, with rubber-band resistance.
- **Theming**: Applied via `data-theme` attribute on `document.documentElement`, using CSS custom properties.
- **Routing**: HashRouter is used for compatibility with GitHub Pages and PWA deployment.
- **Linting**: ESLint configured for TypeScript and React.

## Contributing

1. Follow the strict change discipline outlined in `.github/copilot-instructions.md`.
2. Use the specified naming conventions and folder structure.
3. Ensure mobile-first, iOS-feel UI/UX.

## License

[Add license if applicable]
