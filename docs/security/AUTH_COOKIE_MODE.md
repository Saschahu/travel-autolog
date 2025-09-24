# Authentication Cookie Mode

This document describes the optional cookie-based authentication mode for Travel AutoLog, which provides an alternative to the default IndexedDB token storage.

## Overview

By default, Travel AutoLog uses IndexedDB to store authentication tokens via Supabase Auth. The optional cookie mode moves token storage to the server-side using HttpOnly, Secure cookies.

## Configuration

### Environment Variables

Enable cookie mode by setting:

```env
VITE_AUTH_COOKIE_MODE=true
VITE_AUTH_SESSION_URL=/auth/session
```

- `VITE_AUTH_COOKIE_MODE`: Set to `true` to enable cookie-based authentication
- `VITE_AUTH_SESSION_URL`: Endpoint to check authentication status (default: `/auth/session`)

### Default Mode (IndexedDB)

When `VITE_AUTH_COOKIE_MODE` is `false` or unset:
- Tokens stored in IndexedDB via Supabase client
- Client-side session management
- Works with any Supabase configuration

## Backend Requirements

Cookie mode requires server-side authentication endpoints:

### 1. Login Endpoint (`/auth/login`)

```javascript
// Example: Express.js with cookie support
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Authenticate user (your auth logic here)
  const { user, token, refreshToken } = await authenticateUser(email, password);
  
  if (user) {
    // Set HttpOnly, Secure cookies
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.json({ user: { id: user.id, email: user.email } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

### 2. Session Check Endpoint (`/auth/session`)

```javascript
app.get('/auth/session', async (req, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ user: null });
  }
  
  try {
    // Verify token (your verification logic here)
    const user = await verifyToken(token);
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(401).json({ user: null });
  }
});
```

### 3. Refresh Endpoint (`/auth/refresh`)

```javascript
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  try {
    // Refresh token logic
    const { user, newToken } = await refreshUserToken(refreshToken);
    
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000
    });
    
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### 4. Logout Endpoint (`/auth/logout`)

```javascript
app.post('/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out' });
});
```

## Cookie Configuration

### Required Cookie Attributes

```javascript
{
  httpOnly: true,    // Prevent XSS access
  secure: true,      // HTTPS only
  sameSite: 'strict', // CSRF protection
  path: '/',         // Available site-wide
  maxAge: 3600000    // 1 hour (for auth tokens)
}
```

### Security Considerations

1. **HttpOnly**: Prevents JavaScript access, protecting against XSS
2. **Secure**: Only transmitted over HTTPS
3. **SameSite=Strict**: Prevents CSRF attacks
4. **Short expiration**: Auth tokens should expire quickly (1 hour max)
5. **Refresh tokens**: Longer-lived (30 days) for seamless re-authentication

## CORS Configuration

When using cookie mode, configure CORS to include credentials:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:8080'],
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## CSP Considerations

Cookie mode doesn't require CSP changes, but ensure your auth endpoints are included in `connect-src`:

```
connect-src 'self' https://your-api-domain.com;
```

## Client-Side Implementation

The Travel AutoLog client automatically detects cookie mode and:

1. Makes requests with `credentials: 'include'`
2. Checks auth status via session endpoint
3. Handles token refresh automatically
4. No client-side token storage

## Refresh Flow

1. Client makes API request
2. Server responds with 401 if token expired
3. Client automatically calls `/auth/refresh`
4. New token set in cookie
5. Original request retried

## Migration

### From IndexedDB to Cookie Mode

1. Deploy backend with auth endpoints
2. Set `VITE_AUTH_COOKIE_MODE=true`
3. Rebuild and redeploy frontend
4. Users will need to log in again

### From Cookie Mode to IndexedDB

1. Set `VITE_AUTH_COOKIE_MODE=false`
2. Rebuild and redeploy frontend
3. Users will need to log in again

## Security Benefits

Cookie mode provides several security advantages:

1. **No client-side token storage**: Tokens never exposed to JavaScript
2. **HttpOnly protection**: XSS cannot access authentication tokens  
3. **Automatic cleanup**: Cookies cleared when browser closes
4. **Server-side control**: Tokens can be revoked server-side immediately
5. **CSRF protection**: SameSite=Strict prevents cross-site requests

## Limitations

1. **Backend dependency**: Requires server-side authentication
2. **CORS complexity**: Must handle credentials in CORS setup
3. **Subdomain restrictions**: Cookies limited to same domain
4. **Mobile app considerations**: May need special handling in Capacitor

## Testing

### Test Cookie Mode

1. Set environment variables
2. Rebuild application
3. Test login flow
4. Verify cookies are set with correct attributes
5. Test session persistence across page reloads
6. Test automatic logout on cookie expiration

### Debug Commands

```javascript
// Check current auth mode
import { getAuthMode, logAuthConfig } from '@/security/tokenStorage';
console.log('Auth mode:', getAuthMode());
logAuthConfig();

// Check auth status
import { checkAuthStatus } from '@/security/tokenStorage';
checkAuthStatus().then(session => {
  console.log('Auth status:', session);
});
```

## Next Steps

1. **Implement refresh automation**: Automatic token refresh before expiration
2. **Add token rotation**: Rotate refresh tokens on use
3. **Session management**: Server-side session tracking and management
4. **Audit logging**: Log authentication events for security monitoring