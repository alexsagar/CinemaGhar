# Movie Streaming Backend

A robust backend for a movie streaming platform with automatic content ingestion and quality management.

## Features

- **Automatic Content Ingestion**: Discovers new movies from TMDB and automatically finds streaming sources
- **Quality Management**: Automatically upgrades streams to higher quality when available
- **Provider Adapters**: Pluggable system for different streaming providers
- **Background Jobs**: Agenda-based job scheduling for content processing
- **Real-time Updates**: Server-Sent Events for stream quality upgrades

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 5+
- TMDB API key

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/netflix-clone

# TMDB API
TMDB_API_KEY=your_tmdb_api_key_here

# Ingestion Settings
TARGET_QUALITY=2160p
ALLOW_LOWER_QUALITY_UNTIL_UPGRADE=true
MIN_QUALITY_TO_PUBLISH=720p
INGEST_DISCOVER_CRON="*/30 * * * *"
INGEST_REFRESH_CRON="0 */6 * * *"
INGEST_REVERIFY_CRON="0 */12 * * *"
RATE_LIMIT_RPS=3
GRACE_PERIOD_HOURS=24
MAX_RETRY_ATTEMPTS=3
```

### Installation

```bash
npm install
```

### Running the Application

#### 1. Start the API Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

#### 2. Start the Background Worker
```bash
# Production mode
npm run worker

# Development mode (with auto-restart)
npm run worker:dev
```

#### 3. Frontend Development
```bash
# From the frontend directory
npm run dev
```

### Manual Content Ingestion

#### Run Discovery Once
```bash
npm run ingest:once
```

#### Run Specific Jobs
```bash
# Discover new content from TMDB
curl -X POST http://localhost:5000/api/ingest/run/tmdb.discover

# Match content with streaming sources
curl -X POST http://localhost:5000/api/ingest/run/content.match

# Refresh quality for existing content
curl -X POST http://localhost:5000/api/ingest/run/content.refresh

# Verify streams are still working
curl -X POST http://localhost:5000/api/ingest/run/content.reverify
```

## Automatic Ingestion & Quality Upgrades

### How It Works

The system automatically manages your streaming content through several background jobs:

#### 1. **TMDB Discovery** (`tmdb.discover`)
- **Schedule**: Every 30 minutes (configurable)
- **Purpose**: Discovers new movies from TMDB (now playing, popular, top rated, upcoming)
- **Action**: Queues content matching for new TMDB IDs

#### 2. **Content Matching** (`content.match`)
- **Trigger**: Queued by discovery job or manual request
- **Purpose**: Finds available streaming sources for a specific movie
- **Action**: 
  - Searches all configured providers
  - Creates/updates StreamVersion documents
  - Activates the best available stream
  - Logs all actions for debugging

#### 3. **Quality Refresh** (`content.refresh`)
- **Schedule**: Every 6 hours (configurable)
- **Purpose**: Checks for quality upgrades for existing content
- **Action**:
  - Identifies movies below target quality
  - Searches for better versions
  - Automatically upgrades when found
  - Marks old streams as inactive

#### 4. **Stream Verification** (`content.reverify`)
- **Schedule**: Every 12 hours (configurable)
- **Purpose**: Ensures streams are still working
- **Action**:
  - Tests active streams
  - Marks broken streams as inactive
  - Attempts to find alternatives
  - Cleans up old broken streams

### Quality Hierarchy

The system uses a strict quality ranking:
```
CAM < SD < 720p < 1080p < 1440p < 2160p
```

- **Target Quality**: Default 2160p (4K UHD)
- **Minimum Publishable**: Default 720p (HD)
- **Lower Quality Policy**: Can publish lower quality temporarily while waiting for upgrades

### Provider System

The system supports multiple streaming providers through a pluggable adapter system:

- **AutoEmbed**: Primary provider with high-quality streams
- **2Embed**: Secondary provider
- **MultiEmbed**: Alternative provider
- **EmbedSu**: Fallback provider

Each provider is automatically tested and scored based on reliability and quality.

### Stream Management

#### Active Streams
- Only one stream per movie is active at a time
- System automatically selects the best available quality
- Old streams are marked inactive, not deleted immediately

#### Grace Period
- Inactive streams are kept for 24 hours (configurable)
- Allows for rollback if needed
- Automatically cleaned up after grace period

#### Upgrade Process
1. New higher-quality stream is discovered
2. Old stream is marked inactive with `replacedBy` reference
3. New stream is activated
4. Frontend receives real-time notification
5. Stream switches seamlessly without page reload

### Monitoring & Logging

#### Ingest Logs
All ingestion activities are logged with:
- Job type and status
- TMDB ID and movie ID
- Success/error messages
- Duration and metadata
- Automatic cleanup after 30 days

#### API Endpoints
- `GET /api/ingest/status` - Current job status
- `GET /api/ingest/logs` - Recent ingestion logs
- `POST /api/ingest/run/:job` - Manual job execution

### Configuration

#### Environment Variables
- **`TARGET_QUALITY`**: Desired quality for all content
- **`ALLOW_LOWER_QUALITY_UNTIL_UPGRADE`**: Whether to publish lower quality temporarily
- **`MIN_QUALITY_TO_PUBLISH`**: Minimum quality to show to users
- **`INGEST_*_CRON`**: Cron schedules for each job type
- **`RATE_LIMIT_RPS`**: API rate limiting for providers
- **`GRACE_PERIOD_HOURS`**: How long to keep old streams

#### Runtime Configuration
Settings can be updated via the API:
```bash
# Update target quality
curl -X POST http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"key": "TARGET_QUALITY", "value": "1080p"}'
```

### Troubleshooting

#### Common Issues

1. **Jobs not running**
   - Check MongoDB connection
   - Verify Agenda collection exists
   - Check job scheduler initialization

2. **No streams found**
   - Verify TMDB API key
   - Check provider endpoints
   - Review rate limiting settings

3. **Quality not upgrading**
   - Check target quality setting
   - Verify provider availability
   - Review upgrade policies

#### Debug Commands

```bash
# Check job status
curl http://localhost:5000/api/ingest/status

# View recent logs
curl http://localhost:5000/api/ingest/logs?limit=20

# Initialize scheduler
curl -X POST http://localhost:5000/api/ingest/initialize
```

## API Endpoints

### Streaming
- `GET /api/movies/:id/active-stream` - Get current active stream
- `GET /api/movies/:id/stream-events` - SSE for stream updates
- `GET /api/movies/:id/stream-versions` - All available streams
- `POST /api/movies/:id/activate-stream` - Switch to different stream
- `POST /api/movies/:id/recheck` - Manually trigger content matching

### Ingestion
- `GET /api/ingest/status` - Job scheduler status
- `POST /api/ingest/run/:job` - Execute specific job
- `GET /api/ingest/logs` - View ingestion history

## Development

### Project Structure
```
Backend/
├── models/           # Mongoose schemas
├── routes/           # Express routes
├── server/
│   ├── jobs/        # Background job definitions
│   ├── routes/      # Additional routes
│   └── services/    # Business logic
├── middleware/       # Express middleware
└── server.js        # Main application
```

### Adding New Providers

1. Extend the `LicensedProvider` class in `server/services/provider.js`
2. Add provider-specific logic in `getStreams()` method
3. Update provider enum in `StreamVersion` model
4. Test with content matching job

### Customizing Jobs

1. Modify job logic in `server/jobs/` files
2. Update cron schedules in environment variables
3. Add new job types to the scheduler
4. Test with manual job execution

## Performance

### Optimization Features
- **Rate Limiting**: Prevents API abuse
- **Retry Logic**: Handles temporary failures
- **Connection Pooling**: Efficient database usage
- **Background Processing**: Non-blocking operations
- **Automatic Cleanup**: Prevents data accumulation

### Monitoring
- Job execution times
- Success/failure rates
- Stream quality distribution
- Provider reliability scores
- Database performance metrics

## Security

### Content Security Policy
- Strict iframe sandboxing
- Referrer policy enforcement
- Provider domain validation
- Rate limiting on all endpoints

### Authentication
- JWT-based authentication
- Admin-only ingestion endpoints
- Secure provider token handling
- Audit logging for all operations

## License

ISC License - see LICENSE file for details.
