# 🎬 Movie Streaming Platform

A modern, responsive movie streaming web application built with React, Node.js, and MongoDB. Features automatic content ingestion, quality management, and a professional admin dashboard.

## ✨ Features

### 🎥 **Streaming & Content**
- **Legal Streaming Pipeline**: Integrated with licensed content providers
- **Automatic Quality Upgrades**: Auto-upgrades from lower to higher quality streams
- **Multi-Format Support**: HLS, DASH, Progressive, and licensed embed streams
- **Quality Management**: 2160p, 1440p, 1080p, 720p, SD, CAM support
- **Content Types**: Movies, TV Series, and Animated content

### 🔍 **Discovery & Search**
- **Advanced Search**: Debounced search with real-time results
- **Smart Filtering**: By category, year, rating, and content type
- **TMDB Integration**: Automatic metadata fetching and content discovery
- **Personalized Recommendations**: Based on viewing history and preferences

### 👤 **User Experience**
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Dark/Light Mode**: Theme switching with persistent preferences
- **Watchlist Management**: Save and organize favorite content
- **User Authentication**: Secure login/registration system
- **Progress Tracking**: Resume watching from where you left off

### 🛠️ **Admin Features**
- **Content Management**: Add, edit, and delete movies/series
- **Ingest Pipeline**: Automated content discovery and quality management
- **Stream Analytics**: Real-time monitoring of stream quality and performance
- **User Management**: Admin controls and user analytics
- **Quality Control**: Automatic stream verification and upgrade management

## 🏗️ Tech Stack

### **Frontend**
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Router** - Client-side routing
- **React Query** - Server state management and caching
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation
- **Lucide React** - Beautiful icons

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **Agenda** - Job scheduling and background tasks
- **Axios** - HTTP client with retry logic

### **Infrastructure**
- **MongoDB Atlas** - Cloud database hosting
- **Environment Variables** - Secure configuration management
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection and throttling

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm/pnpm
- MongoDB database (local or Atlas)
- TMDB API key for content metadata

### **1. Clone the Repository**
```bash
git clone <your-repo-url>
cd movie
```

### **2. Backend Setup**
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### **4. Start the Worker (Optional)**
```bash
cd Backend
npm run worker
```

## ⚙️ Environment Configuration

### **Backend (.env)**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/movie-streaming
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster.mongodb.net/movie-streaming

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# TMDB API
TMDB_API_KEY=your-tmdb-api-key
TMDB_BASE_URL=https://api.themoviedb.org/3

# Streaming Pipeline
TARGET_QUALITY=2160p
MIN_QUALITY_TO_PUBLISH=720p
ALLOW_LOWER_QUALITY_UNTIL_UPGRADE=true
INGEST_DISCOVER_CRON=*/30 * * * *
INGEST_REFRESH_CRON=0 */6 * * *
RATE_LIMIT_RPS=3
```

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Movie Streaming
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
movie/
├── Backend/                 # Backend server
│   ├── models/             # Mongoose models
│   ├── routes/             # API endpoints
│   ├── server/             # Core server logic
│   │   ├── services/       # Business logic
│   │   └── jobs/          # Background tasks
│   ├── server.js           # Server entry point
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API
│   │   ├── styles/        # Global styles
│   │   └── App.jsx        # Main app component
│   ├── tailwind.config.js # Tailwind configuration
│   └── package.json
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🎯 Key Components

### **Frontend Components**
- **AppShell**: Main layout with header, navigation, and footer
- **MovieCard**: Reusable movie display component with variants
- **EmbedPlayer**: Streaming player with quality management
- **Admin Dashboard**: Comprehensive admin interface
- **Search & Filters**: Advanced content discovery

### **Backend Services**
- **Provider Service**: Licensed content provider integration
- **Quality Service**: Stream quality normalization and ranking
- **Ingest Pipeline**: Automated content discovery and management
- **Job Scheduler**: Background task management with Agenda

## 🔧 Available Scripts

### **Backend**
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run worker       # Start background job worker
npm run worker:dev   # Start worker in development mode
npm run ingest:once  # Run single ingestion job
```

### **Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

## 🌐 API Endpoints

### **Content Management**
- `GET /api/movies` - List movies with filtering and pagination
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies` - Create new movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

### **Streaming**
- `GET /api/movies/:id/active-stream` - Get active stream URL
- `GET /api/movies/:id/stream-events` - Server-sent events for quality upgrades
- `GET /api/movies/:id/stream-versions` - List available stream versions
- `POST /api/movies/:id/activate-stream` - Activate specific stream version

### **Ingest Pipeline**
- `GET /api/ingest/status` - Pipeline status and job information
- `POST /api/ingest/run/:job` - Trigger specific ingest job
- `POST /api/ingest/initialize` - Initialize ingest pipeline
- `GET /api/ingest/logs` - View ingest operation logs

### **User Management**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/users` - List users (admin only)
- `GET /api/users/stats` - User statistics

## 🎨 Design System

### **Color Palette**
- **Primary**: Brand color for main actions and highlights
- **Secondary**: Supporting color for secondary elements
- **Muted**: Subtle backgrounds and borders
- **Success/Warning/Destructive**: Status and feedback colors

### **Typography**
- **Font Family**: Inter (Google Fonts)
- **Scale**: xs, sm, base, lg, xl, 2xl, 3xl
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### **Spacing & Layout**
- **Grid System**: Responsive grid with Tailwind breakpoints
- **Spacing Scale**: Consistent spacing using Tailwind's spacing scale
- **Border Radius**: md, lg, 2xl for rounded corners
- **Shadows**: sm, md, xl for depth and elevation

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 640px - Optimized for small screens
- **Tablet**: 640px - 1024px - Balanced layout
- **Desktop**: > 1024px - Full-featured experience

### **Mobile Features**
- Touch-friendly interfaces
- Swipe gestures for navigation
- Optimized loading states
- Responsive tables and grids

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Secure configuration management

## 📊 Performance Features

- **React Query**: Efficient data fetching and caching
- **Code Splitting**: Lazy-loaded routes and components
- **Image Optimization**: Lazy loading and responsive images
- **Bundle Optimization**: Vite for fast builds and HMR
- **Background Jobs**: Non-blocking content processing

## 🧪 Testing

### **Frontend Testing**
- **Vitest**: Fast unit testing framework
- **Testing Library**: React component testing utilities
- **Component Tests**: Unit tests for reusable components
- **Integration Tests**: API integration testing

### **Backend Testing**
- **API Testing**: Endpoint validation and testing
- **Job Testing**: Background task verification
- **Database Testing**: Model and query testing

## 🚀 Deployment

### **Frontend Deployment**
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### **Backend Deployment**
```bash
npm run build
npm start
# Use PM2 or similar for process management
```

### **Environment Setup**
- Set production environment variables
- Configure MongoDB Atlas connection
- Set up proper CORS origins
- Configure rate limiting for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility
- Test on multiple devices and browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TMDB** for movie metadata and content discovery
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for high-quality React components
- **React Query** for efficient server state management
- **MongoDB** for the flexible NoSQL database

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples
- Contact the development team

---

**Built with ❤️ using modern web technologies**
