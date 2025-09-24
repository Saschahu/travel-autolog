# Content Security Policy Deployment Guide

This guide provides CSP header configuration for different hosting platforms to secure the Travel AutoLog application.

## Base CSP Policy

The following CSP policy provides strong security while allowing necessary functionality:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: blob: https://api.mapbox.com;
  font-src 'self';
  connect-src 'self' https://api.mapbox.com https://events.mapbox.com;
  worker-src 'self' blob:;
  child-src 'none';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

## Adding Supabase Support

This project uses Supabase backend. The CSP policy already includes the necessary Supabase URLs:

```
connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://pgpszvgsjgkuctcjwwgd.supabase.co wss://pgpszvgsjgkuctcjwwgd.supabase.co;
```

If you're using a different Supabase project, replace `pgpszvgsjgkuctcjwwgd` with your actual Supabase project ID from `VITE_SUPABASE_URL`.

## Platform-Specific Configuration

### Netlify

Create `public/_headers` file (already included in this project):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;
```

### Vercel

Create `vercel.json` in project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        }
      ]
    }
  ]
}
```

### Nginx

Add to your server block in nginx.conf:

```nginx
server {
    # ... other configuration
    
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Apache

Add to .htaccess in web root:

```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src 'self' blob:; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

## Development vs Production

### Development Mode
During development with Vite, you may need to relax the CSP policy:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' ws: wss:;
```

**Note**: Never use `'unsafe-eval'` or `'unsafe-inline'` in production!

### Production Mode
The production CSP (defined above) is strict and secure. It:
- Disallows all inline scripts and styles
- Only allows scripts from same origin
- Restricts connections to necessary APIs (Mapbox, Supabase)
- Prevents XSS and code injection attacks

## Testing CSP

1. Deploy with CSP headers enabled
2. Open browser developer tools
3. Look for CSP violation reports in the console
4. Test all app functionality:
   - Map loading and interaction
   - File uploads/downloads
   - GPS tracking
   - Report generation

## Troubleshooting

### Common Issues

1. **Map tiles not loading**: Ensure `https://api.mapbox.com` is in `img-src` and `connect-src`

2. **WebSocket connections failing**: Add `wss://YOUR_PROJECT.supabase.co` to `connect-src`

3. **Inline styles from libraries**: If a library injects inline styles, you may need to add `'unsafe-inline'` to `style-src` as a last resort

4. **Web Workers not loading**: Ensure `blob:` is in `worker-src`

### CSP Violation Reporting

To collect CSP violations in production, add a `report-uri` directive:

```
Content-Security-Policy: ... report-uri /csp-report;
```

## Next Steps

1. **Trusted Types**: Consider enabling `require-trusted-types-for 'script'` after ensuring all script handling uses Trusted Types
2. **Per-route CSP**: Implement more specific CSP policies for different app sections
3. **CSP Level 3**: Upgrade to newer CSP features like `strict-dynamic` when browser support improves