# Content Security Policy (CSP) Deployment Guide

## Overview

This application implements a strict Content Security Policy for production environments to prevent XSS attacks and other code injection vulnerabilities.

## CSP Configuration

### Base CSP Policy
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: blob: https://api.mapbox.com;
  font-src 'self';
  connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://pgpszvgsjgkuctcjwwgd.supabase.co wss://pgpszvgsjgkuctcjwwgd.supabase.co;
  worker-src 'self' blob:;
  child-src 'none';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### Origin Rationale
- **Mapbox**: `https://api.mapbox.com` and `https://events.mapbox.com` for map tiles and analytics
- **Supabase**: `https://pgpszvgsjgkuctcjwwgd.supabase.co` and `wss://pgpszvgsjgkuctcjwwgd.supabase.co` for database and realtime connections
- **Self**: All application assets served from same origin
- **Data/Blob**: For inline images and generated content (charts, maps)

## Deployment Configurations

### Netlify (_headers file)
The `public/_headers` file is automatically deployed with Netlify builds:
```
/*
  Content-Security-Policy: [policy above]
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

### Nginx
Add to your server block:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://pgpszvgsjgkuctcjwwgd.supabase.co wss://pgpszvgsjgkuctcjwwgd.supabase.co; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Apache (.htaccess)
```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://pgpszvgsjgkuctcjwwgd.supabase.co wss://pgpszvgsjgkuctcjwwgd.supabase.co; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### Vercel (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://pgpszvgsjgkuctcjwwgd.supabase.co wss://pgpszvgsjgkuctcjwwgd.supabase.co; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## Development vs Production

### Development Mode
- CSP is **NOT** enforced in development mode
- Allows `'unsafe-inline'` and `'unsafe-eval'` for better DX
- Hot module replacement requires relaxed policies

### Development Relaxations (if needed)
If you need to relax CSP for development tools, you can modify for dev only:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
```

**⚠️ NEVER use these relaxations in production!**

## Updating CSP

### When to Update
- Adding new external services
- Changing Supabase instances
- Adding new CDNs or APIs

### How to Update
1. Update `public/_headers` for Netlify
2. Update server configuration files
3. Test thoroughly in staging
4. Monitor CSP violation reports

## Troubleshooting

### Common Issues
1. **Inline scripts blocked**: Move to external files or use nonces
2. **Third-party widgets broken**: Add their domains to appropriate directives
3. **Font loading issues**: Ensure font domains in `font-src`
4. **API calls blocked**: Add API domains to `connect-src`

### Testing CSP
1. Open browser developer tools
2. Check Console for CSP violation reports
3. Use CSP Evaluator tools for validation
4. Test all application features after deployment
