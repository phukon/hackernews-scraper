# HackerNews Story Scraper

A robust backend service that collects and serves HackerNews stories in real-time, featuring WebSocket connections for live updates and a MySQL database for persistent storage.

## Running the Project

### Using Docker (Recommended)

1. Clone the repository
2. Make sure Docker and Docker Compose are installed on your system
3. Run the following command to start both the MySQL database and the application:
   ```bash
   docker-compose up --build
   ```
4. The services will be started in the following order:
   - MySQL database on port 3306
   - Backend application on port 3000

### Available Endpoints

- `http://localhost:3000/index.html` - Main page showing real-time story updates
- `http://localhost:3000/story.html` - Individual story view
- `http://localhost:3000/allstories.html` - View all collected stories

### Docker Services

#### MySQL Database
- Port: 3306
- Credentials:
  - Database: hackernews
  - User: admin
  - Password: password
- Persistent volume for data storage
- Health check enabled (10s interval)

#### Backend Application
- Port: 3000
- Auto-connects to MySQL database
- Development mode with source code mounting
- Environment variables pre-configured


## Key Features

### Real-time Story Collection
- Automated collection of new stories from HackerNews API every 5 minutes
- Parallel processing of stories
- Robust error handling and retry mechanisms with exponential backoff
- Efficient batch processing of story details and comments

### WebSocket Integration
- Real-time updates to connected clients when new stories are collected
- Heartbeat mechanism for connection health monitoring (5-second interval)
- Automatic connection cleanup for inactive clients
- Initial stats delivery upon client connection

### Database Architecture
- MySQL database with well-structured relations between stories, comments, and users
- Efficient schema design using Drizzle ORM
- Key relations:
  - Stories → Comments (one-to-many)
  - Stories → Users (many-to-one)
  - Comments → Users (many-to-one)
  - Comments → Stories (many-to-one)

### Docker Setup
- Multi-stage build process for optimized container size
- Containerized MySQL 8.0 database
- Health checks for both database and application
- Volume persistence for database data
- Environment variable configuration
- Development-friendly setup with source code mounting

## Technical Implementation

### Story Collection Process
- Fetches new stories from HackerNews API
- Filters out already processed stories
- Parallel processing of story details
- Recursive comment collection
- Real-time WebSocket broadcasts for new stories

### Database Schema
- User table: Stores HackerNews user information
- Story table: Maintains story details with user relations
- Comment table: Stores hierarchical comment structure
- Efficient indexing and foreign key relationships

### Docker Configuration
- Backend service runs on port 3000
- MySQL service with proper credentials and database setup
- Health monitoring for both services
- Development-optimized with hot-reload capabilities

## Environment Variables
- `DB_HOST`: MySQL host
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `PORT`: Application port (default: 3000)

## Architecture Highlights
- Parallel execution using Promise.allSettled
- Manual WebSocket connection with ping alive check
- Efficient batch processing
- Robust error handling
- Real-time updates