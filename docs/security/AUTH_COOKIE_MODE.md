# Authentication Cookie Mode

## Overview

The Travel AutoLog application supports an optional "cookie mode" for authentication where tokens are managed server-side using secure HTTP-only cookies instead of client-side storage.

## Configuration

### Enable Cookie Mode
Set the environment variable:
```bash
VITE_AUTH_COOKIE_MODE=true
```

### Session Endpoint
Configure the session check endpoint (defaults to `/auth/session`):
```bash
VITE_AUTH_SESSION_URL=/api/auth/session
```

## Backend Requirements

When cookie mode is enabled, your backend must implement the following:

### 1. Session Endpoint
**Endpoint:** `GET /auth/session` (or configured URL)
**Purpose:** Check authentication status and return token if authenticated

**Request Headers:**
- Must accept cookies sent by browser
- Should include `credentials: 'include'` in fetch requests

**Response:**
```json
{
  "authenticated": true,
  "token": "pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGo..."
}
```

**Status Codes:**
- `200 OK`: User is authenticated (with token in response)
- `401 Unauthorized`: User is not authenticated
- `403 Forbidden`: Session expired or invalid

### 2. Cookie Security Requirements

**HttpOnly Cookies:**
```javascript
// Example with Express.js
app.use(session({
  cookie: {
    httpOnly: true,      // Prevents XSS access
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
```

**Cookie Attributes:**
- `HttpOnly`: ✅ **REQUIRED** - Prevents JavaScript access
- `Secure`: ✅ **REQUIRED** - HTTPS only in production  
- `SameSite=Strict`: ✅ **RECOMMENDED** - CSRF protection
- `Path=/`: ✅ **RECOMMENDED** - Application-wide scope

### 3. Login/Logout Endpoints

**Login Endpoint:**
```
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secure_password",
  "mapbox_token": "pk.eyJ..."
}
```

**Logout Endpoint:**
```
POST /auth/logout
```
Must clear session cookies and invalidate server-side session.

## Client-Side Behavior

### Token Storage
- ❌ **Client-side storage disabled** - `setToken()` will throw error
- ✅ **Server-side only** - Token retrieved via session endpoint
- ✅ **Automatic migration** - Existing localStorage tokens handled gracefully

### Authentication Flow
1. User logs in via server endpoint
2. Server sets secure HttpOnly cookie
3. Client checks authentication via `/auth/session`
4. Server validates session and returns token
5. Client uses token for Mapbox API calls

### Error Handling
- Session check failures fall back gracefully
- Invalid sessions prompt re-authentication
- Network errors don't break application

## Security Benefits

### Client-Side Attack Prevention
- **XSS Protection**: Tokens not accessible to malicious scripts
- **Local Storage Attacks**: No sensitive data in browser storage
- **Session Hijacking**: Secure cookie attributes prevent common attacks

### Server-Side Control
- **Token Rotation**: Server can rotate tokens without client changes
- **Centralized Revocation**: Instant token revocation across all sessions
- **Audit Logging**: Complete authentication audit trail

## Implementation Example

### Backend (Express.js + JWT)
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { username, password, mapbox_token } = req.body;
  
  // Validate credentials
  const user = await validateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Validate and store Mapbox token
  if (!isValidMapboxToken(mapbox_token)) {
    return res.status(400).json({ error: 'Invalid Mapbox token' });
  }
  
  // Create session
  const sessionToken = jwt.sign(
    { userId: user.id, mapboxToken: mapbox_token },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.cookie('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.json({ success: true });
});

// Session check endpoint
app.get('/auth/session', (req, res) => {
  const sessionToken = req.cookies.session;
  
  if (!sessionToken) {
    return res.status(401).json({ authenticated: false });
  }
  
  try {
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
    res.json({
      authenticated: true,
      token: decoded.mapboxToken
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ success: true });
});
```

### Frontend Usage
```typescript
import { getToken } from '@/security/tokenStorage';

async function initializeMap() {
  const token = await getToken();
  if (!token) {
    // Redirect to login or show token input
    return;
  }
  
  // Use token for Mapbox initialization
  mapboxgl.accessToken = token;
}
```

## Migration Path

### From Client Storage to Cookie Mode
1. Deploy backend with session endpoints
2. Set `VITE_AUTH_COOKIE_MODE=true`
3. Existing localStorage tokens automatically handled
4. Users seamlessly migrate on next login

### Testing Cookie Mode
1. Set environment variables in development
2. Implement mock session endpoint
3. Test authentication flows
4. Verify security headers and cookie attributes

## Troubleshooting

### Common Issues
- **CORS errors**: Ensure `credentials: 'include'` in fetch requests
- **Cookie not set**: Check Secure flag in development (use HTTP or disable)
- **Session expired**: Implement refresh logic or redirect to login
- **Token not found**: Verify session endpoint response format

### Debug Steps
1. Check browser cookies in DevTools
2. Verify session endpoint response
3. Monitor network requests for authentication calls
4. Check server logs for session validation errors
