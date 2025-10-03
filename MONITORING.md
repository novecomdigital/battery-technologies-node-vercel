# Monitoring & Observability Setup

This guide covers setting up monitoring, logging, error tracking, and performance monitoring for your application.

## 🎯 Overview

A comprehensive monitoring strategy includes:

1. **Error Tracking** - Catch and debug production errors
2. **Performance Monitoring** - Track application performance
3. **Logging** - Application and server logs
4. **Uptime Monitoring** - Service availability
5. **Analytics** - User behavior and metrics

---

## 🚨 Error Tracking with Sentry

### Setup

1. **Create Sentry Account**
   ```bash
   # Sign up at sentry.io
   # Create new project (Next.js)
   ```

2. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Run Configuration Wizard**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

4. **Configure Environment Variables**
   ```env
   # .env.local
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   
   # For Vercel, add to Environment Variables dashboard
   ```

5. **Sentry Configuration Files**

**`sentry.client.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  environment: process.env.NODE_ENV,
  
  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',
})
```

**`sentry.server.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
```

**`sentry.edge.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
```

### Usage in Code

**Capture Errors:**
```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Your code
} catch (error) {
  Sentry.captureException(error)
  // Handle error
}
```

**Add Context:**
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
})

Sentry.setTag('page', 'dashboard')
Sentry.setContext('order', {
  id: order.id,
  amount: order.total,
})
```

**Manual Events:**
```typescript
Sentry.captureMessage('Something important happened', 'info')
```

### Sentry Alerts

Configure alerts in Sentry dashboard:

1. Go to **Alerts** → **Create Alert**
2. Set conditions:
   - Error rate exceeds threshold
   - New issue detected
   - Performance degradation
3. Set notification channels (email, Slack, PagerDuty)

---

## 📊 Performance Monitoring

### Vercel Analytics

Automatically enabled on Vercel deployments. No setup required!

**View Metrics:**
- Go to Vercel Dashboard → Your Project → Analytics
- Track: Visitors, Pageviews, Top Pages, Devices, Countries

### Web Vitals Tracking

**`src/app/layout.tsx`:**
```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Custom Performance Tracking

**Track API Performance:**
```typescript
// src/app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()
  
  try {
    const data = await fetchData()
    
    const duration = Date.now() - start
    console.log(`API /users took ${duration}ms`)
    
    return NextResponse.json(data)
  } catch (error) {
    // Track slow or failed requests
    Sentry.captureException(error)
    throw error
  }
}
```

**Track Component Performance:**
```typescript
'use client'

import { useEffect } from 'react'

export function DashboardPage() {
  useEffect(() => {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      console.log(`Dashboard rendered in ${duration}ms`)
    }
  }, [])
  
  return <div>Dashboard</div>
}
```

---

## 📝 Logging

### Structured Logging

**Create Logger Utility:**

**`src/lib/logger.ts`:**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Datadog, LogRocket)
      console.log(JSON.stringify(entry))
    } else {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, context || '')
    }
  }
  
  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }
  
  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }
  
  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }
  
  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, { ...context, error: error?.message, stack: error?.stack })
  }
}

export const logger = new Logger()
```

**Usage:**
```typescript
import { logger } from '@/lib/logger'

logger.info('User logged in', { userId: user.id })
logger.warn('Rate limit approaching', { userId: user.id, requests: 95 })
logger.error('Failed to process payment', error, { orderId: order.id })
```

### API Request Logging

**Middleware for Request Logging:**

**`src/middleware.ts`:**
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export function middleware(request: NextRequest) {
  const start = Date.now()
  
  // Log request
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  })
  
  const response = NextResponse.next()
  
  // Log response
  const duration = Date.now() - start
  logger.info('Response sent', {
    method: request.method,
    url: request.url,
    status: response.status,
    duration: `${duration}ms`,
  })
  
  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

---

## 🔍 Uptime Monitoring

### UptimeRobot (Free)

1. **Sign up** at [uptimerobot.com](https://uptimerobot.com)
2. **Add Monitor**:
   - Type: HTTPS
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
3. **Configure Alerts**:
   - Email notifications
   - Slack/Discord webhooks
   - SMS (paid)

### Pingdom / StatusCake (Alternatives)

Similar setup to UptimeRobot, with additional features:
- Multi-location checks
- Page speed monitoring
- Transaction monitoring
- Public status pages

---

## 📈 Analytics & User Tracking

### Vercel Analytics (Recommended)

**Already included** in the template. View in Vercel dashboard.

### PostHog (Advanced Analytics)

**Setup:**
```bash
npm install posthog-js
```

**`src/lib/posthog.ts`:**
```typescript
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    },
  })
}

export default posthog
```

**Track Events:**
```typescript
import posthog from '@/lib/posthog'

// Track custom events
posthog.capture('user_signed_up', {
  plan: 'pro',
  source: 'landing_page',
})

// Identify users
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
})
```

### Google Analytics (Optional)

**Setup:**
```bash
npm install @next/third-parties
```

**`src/app/layout.tsx`:**
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
      </body>
    </html>
  )
}
```

---

## 🎛️ Monitoring Dashboard

### Key Metrics to Track

**Application Health:**
- Error rate
- Response times
- Uptime percentage
- Request volume

**Business Metrics:**
- User signups
- Active users
- Feature usage
- Conversion rates

**Infrastructure:**
- Database query performance
- API endpoint latency
- Memory/CPU usage
- Network bandwidth

### Creating Dashboards

**Sentry Dashboard:**
1. Go to **Dashboards** in Sentry
2. Create custom widgets:
   - Error frequency
   - Most common errors
   - Affected users
   - Performance metrics

**Vercel Dashboard:**
- Built-in analytics
- Deployment history
- Function logs
- Edge network metrics

---

## 🚨 Alerting Strategy

### Alert Levels

**Critical (Immediate Action):**
- Service down (>1 minute)
- Error rate >10%
- Database unavailable
- Payment processing failing

**High (Action Within 1 Hour):**
- Error rate >5%
- API response time >1s
- Failed deployments
- High memory usage

**Medium (Action Within 24 Hours):**
- Error rate >2%
- Performance degradation
- Disk space warnings
- Security scan issues

**Low (Review in Next Sprint):**
- Minor errors
- Performance opportunities
- Code quality issues
- Documentation gaps

### Alert Channels

1. **Critical**: PagerDuty + SMS + Slack
2. **High**: Slack + Email
3. **Medium**: Email
4. **Low**: Weekly digest email

---

## 🔧 Implementation Checklist

### Initial Setup
- [ ] Sentry configured and tested
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring configured
- [ ] Logging utility implemented
- [ ] Health check endpoint created

### Production Readiness
- [ ] Alert rules configured
- [ ] On-call rotation established
- [ ] Runbooks created for common issues
- [ ] Dashboard bookmarked
- [ ] Team trained on monitoring tools

### Ongoing
- [ ] Review error rates weekly
- [ ] Analyze performance trends monthly
- [ ] Update alert thresholds quarterly
- [ ] Test alerting system quarterly

---

## 🐛 Debugging in Production

### Viewing Logs

**Vercel:**
```bash
# View real-time logs
vercel logs --follow

# View specific deployment logs
vercel logs [DEPLOYMENT_URL]
```

**Sentry:**
- Go to Issues → Select error
- View breadcrumbs, stack trace, user context
- Replay session (if enabled)

### Common Issues

**High Error Rate:**
1. Check Sentry for error patterns
2. Review recent deployments
3. Check external service status
4. Review database performance

**Slow Performance:**
1. Check Vercel Analytics for slow pages
2. Review database query logs
3. Check for N+1 queries
4. Analyze bundle size

**Memory Leaks:**
1. Monitor memory usage trends
2. Check for unclosed connections
3. Review event listeners
4. Analyze component lifecycle

---

## 📊 Monitoring Best Practices

### DO:
✅ Monitor critical user flows
✅ Set reasonable alert thresholds
✅ Review dashboards regularly
✅ Document runbooks for common issues
✅ Test alerting system regularly
✅ Track business metrics, not just technical

### DON'T:
❌ Alert on every minor issue
❌ Ignore alert fatigue
❌ Set up monitoring without action plans
❌ Only monitor production
❌ Forget to update runbooks
❌ Track metrics without goals

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Next.js Monitoring](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [PostHog Documentation](https://posthog.com/docs)

---

**Last Updated**: 2024-01-01
**Maintained By**: Development Team

