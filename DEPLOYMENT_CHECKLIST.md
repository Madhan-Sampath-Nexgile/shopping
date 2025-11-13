# Deployment Checklist - Phase 1

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All Phase 1 features implemented
- [x] No console errors in production build
- [x] All imports resolved correctly
- [x] Toast notifications using correct context
- [x] No hardcoded API URLs in production
- [ ] ESLint checks passing
- [ ] Code formatted consistently
- [ ] Remove debug console.logs

### ✅ Testing
- [x] Manual testing completed
- [x] All API endpoints responding
- [x] Frontend routing working
- [x] Authentication flow tested
- [x] Checkout flow tested with variants
- [x] Discount codes validated
- [x] Order tracking displaying correctly
- [ ] Load testing performed
- [ ] Security audit completed
- [ ] Browser compatibility tested

### ✅ Database
- [x] All migrations applied
- [x] Seed data loaded (optional)
- [x] Indexes created
- [x] Foreign keys established
- [ ] Backup strategy configured
- [ ] Connection pooling optimized
- [ ] Query performance analyzed

---

## Environment Configuration

### Backend Environment Variables (.env)

**Development:**
```env
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartshop
DB_USER=postgres
DB_PASSWORD=your_dev_password
JWT_SECRET=your_development_secret_key_min_32_chars
CORS_ORIGIN=http://localhost:5173
```

**Production:**
```env
PORT=4000
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=smartshop_prod
DB_USER=prod_user
DB_PASSWORD=strong_production_password_here
JWT_SECRET=very_strong_random_secret_key_min_32_characters
CORS_ORIGIN=https://yourdomain.com
```

### Frontend Environment Variables (.env)

**Development:**
```env
VITE_API_URL=http://localhost:4000/api
```

**Production:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Security Checklist

### Backend Security
- [ ] Change default admin password
- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly (specific origins only)
- [ ] Add rate limiting middleware
- [ ] Enable helmet.js for security headers
- [ ] Sanitize all user inputs
- [ ] Validate file uploads (if any)
- [ ] Hide error stack traces in production
- [ ] Enable SQL injection protection (already using parameterized queries)
- [ ] Set secure cookie flags
- [ ] Implement CSRF protection

### Frontend Security
- [ ] Remove all console.log statements
- [ ] Obfuscate/minify production build
- [ ] Enable Content Security Policy
- [ ] Sanitize user-generated content
- [ ] Use HTTPS only
- [ ] Implement XSS protection
- [ ] Secure local storage usage

### Database Security
- [ ] Strong database password
- [ ] Limit database user permissions
- [ ] Enable SSL connections
- [ ] Regular backups scheduled
- [ ] Backup encryption enabled
- [ ] Access logging enabled
- [ ] Firewall rules configured

---

## Performance Optimization

### Backend
- [ ] Enable gzip compression
- [ ] Implement API response caching
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Connection pooling configured
- [ ] Rate limiting implemented
- [ ] Static asset CDN configured
- [ ] Image optimization

### Frontend
- [ ] Build for production (`npm run build`)
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Image lazy loading
- [ ] Bundle size optimized
- [ ] Service worker configured (PWA)
- [ ] Assets minified and compressed

### Database
- [ ] Indexes on frequently queried columns
- [ ] Query execution plans analyzed
- [ ] Unused indexes removed
- [ ] Statistics updated
- [ ] Vacuum performed
- [ ] Connection limits set

---

## Monitoring & Logging

### Application Monitoring
- [ ] Error tracking (Sentry, LogRocket, etc.)
- [ ] Performance monitoring (New Relic, DataDog, etc.)
- [ ] Uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Log aggregation (ELK, Splunk, etc.)
- [ ] Custom metrics dashboard
- [ ] Alert notifications configured

### Server Monitoring
- [ ] CPU usage monitoring
- [ ] Memory usage monitoring
- [ ] Disk space monitoring
- [ ] Network monitoring
- [ ] Database connection pool monitoring

### Logging
- [ ] Structured logging implemented
- [ ] Log levels configured correctly
- [ ] Sensitive data excluded from logs
- [ ] Log rotation configured
- [ ] Centralized log storage

---

## Backup & Recovery

### Database Backups
- [ ] Automated daily backups
- [ ] Backup retention policy (30 days)
- [ ] Backup encryption enabled
- [ ] Backup restore tested
- [ ] Point-in-time recovery available
- [ ] Offsite backup storage

### Application Backups
- [ ] Code repository backed up
- [ ] Configuration files backed up
- [ ] Environment variables documented
- [ ] Deployment scripts backed up

### Disaster Recovery Plan
- [ ] Recovery procedures documented
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Failover procedures tested
- [ ] Contact list maintained

---

## Deployment Steps

### 1. Prepare Production Server

**Option A: VPS (DigitalOcean, Linode, AWS EC2)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

**Option B: Platform as a Service (Heroku, Railway, Render)**
- Follow platform-specific deployment guides
- Configure environment variables in dashboard
- Connect GitHub repository for auto-deployment

### 2. Setup Database

```bash
# Create production database
sudo -u postgres psql
CREATE DATABASE smartshop_prod;
CREATE USER prod_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE smartshop_prod TO prod_user;
\q

# Apply migrations
psql -U prod_user -d smartshop_prod -f database/migrations/001_initial_schema.sql
psql -U prod_user -d smartshop_prod -f database/migrations/002_wishlist.sql
psql -U prod_user -d smartshop_prod -f database/migrations/003_reviews.sql
psql -U prod_user -d smartshop_prod -f database/migrations/004_cart_saved.sql
psql -U prod_user -d smartshop_prod -f database/migrations/005_browsing_history.sql
psql -U prod_user -d smartshop_prod -f database/migrations/006_compare.sql
psql -U prod_user -d smartshop_prod -f database/migrations/007_phase1_core_ecommerce.sql

# Optional: Load seed data
psql -U prod_user -d smartshop_prod -f database/seed.sql
```

### 3. Deploy Backend

```bash
# Clone repository
git clone <your-repo-url>
cd task_gemini/backend

# Install dependencies
npm ci --production

# Create .env file
nano .env
# (Add production environment variables)

# Test backend
npm start

# Start with PM2
pm2 start src/server.js --name smartshop-backend
pm2 save
pm2 startup
```

### 4. Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm ci

# Create production .env
nano .env
# (Add VITE_API_URL)

# Build for production
npm run build

# Copy build to web server
sudo cp -r dist/* /var/www/smartshop/
```

### 5. Configure Nginx

```nginx
# /etc/nginx/sites-available/smartshop
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/smartshop;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smartshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL Certificate

```bash
# Get SSL certificate (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 7. Configure Firewall

```bash
# UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Post-Deployment Verification

### Smoke Tests
- [ ] Website loads at production URL
- [ ] HTTPS certificate valid
- [ ] Homepage renders correctly
- [ ] User registration works
- [ ] Login/logout works
- [ ] Product browsing works
- [ ] Add to cart works
- [ ] Checkout flow completes
- [ ] Order tracking displays
- [ ] Admin dashboard accessible
- [ ] Password reset works
- [ ] API endpoints responding

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 200ms
- [ ] Lighthouse score > 85
- [ ] Mobile responsive working
- [ ] Images loading properly
- [ ] No console errors

### Security Tests
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Rate limiting working
- [ ] CORS configured correctly
- [ ] Authentication required for protected routes

---

## Rollback Plan

### If Deployment Fails

**Backend Rollback:**
```bash
# Revert to previous commit
git reset --hard HEAD~1
pm2 restart smartshop-backend
```

**Frontend Rollback:**
```bash
# Restore previous build
sudo cp -r /var/www/smartshop.backup/* /var/www/smartshop/
```

**Database Rollback:**
```bash
# Restore from backup
pg_restore -U prod_user -d smartshop_prod backup_file.dump
```

---

## Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor server resources
- [ ] Check uptime status
- [ ] Review alert notifications

### Weekly
- [ ] Review performance metrics
- [ ] Check database size growth
- [ ] Analyze user activity
- [ ] Review security logs

### Monthly
- [ ] Update dependencies
- [ ] Security audit
- [ ] Backup verification
- [ ] Disaster recovery test
- [ ] Performance optimization review

---

## Common Issues & Solutions

### Issue: Backend won't start
**Check:**
- Database connection string
- JWT_SECRET is set
- Port 4000 is available
- Node.js version is 18+
- All dependencies installed

### Issue: Frontend shows 404 on refresh
**Solution:**
- Configure Nginx to fallback to index.html
- Add `try_files $uri $uri/ /index.html;`

### Issue: API requests failing (CORS)
**Solution:**
- Set correct CORS_ORIGIN in backend .env
- Include credentials in frontend axios config

### Issue: Database connection pool exhausted
**Solution:**
- Increase max connections in pg pool config
- Review slow queries
- Add indexes to frequently queried columns

### Issue: SSL certificate expired
**Solution:**
```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

## Support Contacts

**Technical Issues:**
- Backend Developer: [contact]
- Frontend Developer: [contact]
- DevOps Engineer: [contact]

**Emergency Contacts:**
- On-call Engineer: [phone]
- Database Administrator: [contact]
- System Administrator: [contact]

---

## Success Criteria

### Deployment is successful when:
- [x] All smoke tests pass
- [ ] No critical errors in logs
- [ ] Response times within SLA
- [ ] All monitoring alerts configured
- [ ] Backup systems verified
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Rollback plan tested

---

**Last Updated:** January 13, 2025
**Deployment Target:** Phase 1 Production Release
**Status:** Ready for deployment after checklist completion
