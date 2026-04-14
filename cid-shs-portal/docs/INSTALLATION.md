# SHS Portal - Installation and Setup Guide

This document provides complete instructions for setting up and running the SDO Cabuyao SHS Portal application.

## Prerequisites

Before installing, ensure you have the following:

- **Node.js** - Version 18.x or higher
- **MySQL** - Version 8.0 or higher
- **npm** - Comes with Node.js

## Project Structure

```
cid-shs-portal/
├── backend/           # Express.js API server
│   ├── config/       # Database configuration
│   ├── controllers/  # Route handlers
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   ├── tests/        # Test files
│   └── server.js     # Entry point
│
└── frontend/         # React + Vite application
    ├── public/       # Static assets
    └── src/          # React source code
        ├── components/
        ├── pages/
        ├── services/
        └── styles/
```

---

## Installation Commands

### 1. Install Backend Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd cid-shs-portal/backend
npm install
```

**Backend Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| bcryptjs | ^3.0.3 | Password hashing |
| cors | ^2.8.6 | Cross-origin resource sharing |
| dotenv | ^17.3.1 | Environment variables |
| express | ^5.2.1 | Web framework |
| express-validator | ^7.3.1 | Input validation |
| helmet | ^8.1.0 | Security headers |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| morgan | ^1.10.1 | HTTP request logging |
| multer | ^2.1.1 | File uploads |
| mysql2 | ^3.19.1 | MySQL driver |

**Backend Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.1.14 | Auto-restart server |
| jest | ^29.6.1 | Testing framework |
| supertest | ^6.3.3 | HTTP testing |

### 2. Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd cid-shs-portal/frontend
npm install
```

**Frontend Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.13.6 | HTTP client |
| bootstrap | ^5.3.8 | CSS framework |
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | React DOM |
| react-router-dom | ^6.30.3 | Routing |

**Frontend Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.4.9 | Build tool |
| @vitejs/plugin-react | ^4.3.3 | React plugin |
| eslint | ^9.9.1 | Linting |

---

## Database Setup

### 1. Configure MySQL

Create a MySQL database named `shs_portal`:

```bash
mysql -u root -p
CREATE DATABASE shs_portal;
```

### 2. Update Environment Variables

Edit the backend `.env` file:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shs_portal

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
```

---

## Running the Application

### Development Mode

**Start Backend Server:**

```bash
cd cid-shs-portal/backend
npm run dev
```

Or using nodemon directly:

```bash
npx nodemon server.js
```

The backend will start on `http://localhost:3001`

**Start Frontend Development Server:**

```bash
cd cid-shs-portal/frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

**Build Frontend:**

```bash
cd cid-shs-portal/frontend
npm run build
```

The build output will be in `cid-shs-portal/frontend/dist/`

**Start Backend for Production:**

```bash
cd cid-shs-portal/backend
node server.js
```

---

## Available Scripts

### Backend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (requires nodemon) |
| `npm test` | Run tests |

### Frontend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Testing

### Run Backend Tests

```bash
cd cid-shs-portal/backend
npm test
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Issuances
- `GET /api/issuances` - Get all issuances
- `GET /api/issuances/:id` - Get issuance by ID

---

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is in use, you can change it:

**Backend:**
```bash
PORT=3002 npm run dev
```

**Frontend:**
Edit `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3000
  }
})
```

### Database Connection Issues

1. Verify MySQL is running
2. Check `.env` credentials
3. Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Node Modules Issues

If you encounter errors with node_modules:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## Quick Start Commands Summary

```bash
# Clone or navigate to project
cd cid-shs-portal

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
cd frontend && npm run dev
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router, Bootstrap 5 |
| Build Tool | Vite |
| Backend | Express.js |
| Database | MySQL |
| Authentication | JWT |
| Testing | Jest, Supertest |

---

## Version Information

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **MySQL**: 8.0 or higher
- **React**: 18.3.1
- **Express**: 5.2.1
