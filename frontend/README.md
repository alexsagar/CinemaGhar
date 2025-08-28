# StreamFlix - Modern Movie Streaming Platform

A polished, responsive, and accessible movie streaming web application built with React, Tailwind CSS, and modern web technologies.

## ✨ Features

### 🎨 **Design System**
- **Tailwind CSS** with custom design tokens
- **Dark/Light Mode** with system preference detection
- **Responsive Design** - mobile-first approach
- **Accessibility** - WCAG 2.1 AA compliant
- **Modern UI** with smooth animations and transitions

### 🎬 **Content Management**
- **Movie Library** with categories and content types
- **Smart Search** with debounced input and filters
- **Content Discovery** - trending, popular, latest releases
- **Responsive Grid Layouts** for different screen sizes
- **Horizontal Scrolling** sections with navigation controls

### 🔍 **Advanced Filtering**
- **Category Filters** (Action, Comedy, Drama, etc.)
- **Content Type Filters** (Movies, TV Series, Animated)
- **Search Functionality** with real-time results
- **URL State Management** for shareable filtered views

### 👤 **User Experience**
- **Persistent Watchlist** (localStorage + backend sync)
- **Watch History** tracking
- **User Authentication** with JWT
- **Admin Panel** for content management
- **Responsive Navigation** with mobile drawer

### 🚀 **Performance & Quality**
- **React Query** for efficient data fetching and caching
- **Code Splitting** with React.lazy and Suspense
- **Lazy Loading** images and components
- **Skeleton Loading** states for better UX
- **Error Boundaries** and fallback UI

## 🛠️ Tech Stack

### **Frontend**
- **React 19** with modern hooks and patterns
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **React Query** for server state management
- **Lucide React** for beautiful icons

### **Backend**
- **Node.js** with Express framework
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with bcrypt
- **RESTful API** with proper error handling
- **CORS** enabled for cross-origin requests

### **Development Tools**
- **ESLint** for code quality
- **PostCSS** with Autoprefixer
- **TypeScript-like** type definitions
- **Git hooks** for consistent commits

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB instance (local or cloud)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd movie

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/streamflix
JWT_SECRET=your-super-secret-jwt-key
TMDB_API_KEY=your-tmdb-api-key
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Servers

#### Backend
```bash
cd Backend
npm start
# Server will run on http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm run dev
# App will run on http://localhost:5173
```

### 4. Build for Production
```bash
cd frontend
npm run build
# Built files will be in dist/ folder
```

## 📱 Usage Guide

### **Navigation**
- **Home** - Browse trending and categorized content
- **Search** - Find specific movies/shows with filters
- **Profile** - Manage watchlist and preferences
- **Admin** - Content management (admin users only)

### **Content Discovery**
- **Trending Sections** - High-rated content by type
- **Category Browsing** - Filter by genre or content type
- **Search & Filters** - Advanced content discovery
- **Responsive Grids** - Optimized for all screen sizes

### **User Features**
- **Watchlist Management** - Save content for later
- **Watch History** - Track what you've watched
- **Theme Toggle** - Switch between light/dark modes
- **Responsive Design** - Works on all devices

## 🎯 Key Components

### **AppShell**
- Responsive header with navigation
- Mobile-friendly drawer menu
- Theme toggle and user menu
- Search functionality

### **MovieCard**
- Multiple variants (default, compact, featured)
- Hover effects and quick actions
- Content type badges and ratings
- Responsive image handling

### **Home Page**
- Hero section with app introduction
- Categorized content sections
- Advanced filtering and search
- Skeleton loading states

### **API Layer**
- Centralized API client
- Error handling and interceptors
- Authentication token management
- Query caching with React Query

## 🔧 Customization

### **Design System**
The app uses a comprehensive design system with CSS custom properties:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... more tokens */
}
```

### **Tailwind Configuration**
Custom Tailwind config with:
- Extended color palette
- Custom animations and keyframes
- Responsive breakpoints
- Component utilities

### **Component Variants**
Components support multiple variants:
- **MovieCard**: `default`, `compact`, `featured`
- **Buttons**: `primary`, `secondary`, `outline`, `ghost`
- **Layouts**: Responsive grid systems

## 📊 Performance

### **Lighthouse Targets**
- **Performance**: ≥ 90
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **SEO**: ≥ 90

### **Optimizations**
- **Code Splitting** with React.lazy
- **Image Lazy Loading** with loading="lazy"
- **Query Caching** with React Query
- **Bundle Optimization** with Vite
- **CSS Purge** with Tailwind

## 🧪 Testing

### **Unit Tests**
```bash
npm run test
```

### **E2E Tests**
```bash
npm run test:e2e
```

### **Linting**
```bash
npm run lint
```

## 🚀 Deployment

### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Deploy dist/ folder
```

### **Backend (Railway/Render)**
```bash
# Set environment variables
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Style**
- Use Prettier for formatting
- Follow ESLint rules
- Write meaningful commit messages
- Test your changes locally

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Tailwind CSS** for the utility-first CSS framework
- **React Query** for efficient data fetching
- **Lucide** for beautiful icons
- **Vite** for fast build tooling

---

**Built with ❤️ using modern web technologies**
