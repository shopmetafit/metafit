# 🚀 Deployment Checklist - Blue Dart Integration

**Before deploying to production, complete every item in this checklist.**

---

## 📋 Pre-Deployment Setup (Before First Deploy)

### Environment Configuration
- [ ] Create `.env.production` (copy from `.env.example`)
- [ ] Add all Blue Dart credentials:
  - [ ] `BLUEDART_API_KEY`
  - [ ] `BLUEDART_API_SECRET`
  - [ ] `BLUEDART_LOGIN_ID`
  - [ ] `BLUEDART_LICENSE_KEY`
  - [ ] `BLUEDART_CUSTOMER_CODE`
  - [ ] `BLUEDART_ORIGIN_AREA`
- [ ] Add shipper details:
  - [ ] `SHIPPER_ADDRESS`
  - [ ] `SHIPPER_CITY`
  - [ ] `SHIPPER_STATE`
  - [ ] `SHIPPER_PINCODE`
  - [ ] `SHIPPER_PHONE`
  - [ ] `SHIPPER_EMAIL`
- [ ] Set `NODE_ENV=production`
- [ ] Set `MONGODB_URI` to production database
- [ ] Verify JWT secret is set
- [ ] Test all env vars are present: `node test-bluedart.js`

### Database Setup
- [ ] Create MongoDB production database
- [ ] Verify connection string works
- [ ] Enable authentication
- [ ] Create indexes (auto-created by Mongoose):
  ```javascript
  // Verify these exist:
  db.orders.getIndexes()           // Should have indices on status, awbNo
  db.trackinghistories.getIndexes() // Should have indices on orderId, awbNo
  ```
- [ ] Enable backups (daily minimum)
- [ ] Test backup/restore process
- [ ] Configure replication (if applicable)

### Code Quality
- [ ] Run linter: `npm run lint` (or equivalent)
- [ ] No console.log in production code (except logging service)
- [ ] No TODO comments blocking features
- [ ] All error codes documented
- [ ] No hardcoded credentials anywhere

### Testing
- [ ] Unit tests pass (if applicable)
- [ ] Integration tests pass
- [ ] End-to-end flow tested:
  ```
  Create Order → Mark Paid → Ship → Track → Verify
  ```
- [ ] Error scenarios tested:
  ```
  - Order not paid
  - AWB already exists
  - Blue Dart balance insufficient
  - Address missing
  ```
- [ ] Offline scenario tested:
  ```
  - Mock Blue Dart failure
  - Verify tracking falls back to cache
  ```

### Security
- [ ] No secrets in `.gitignore` files
- [ ] JWT secret is strong (32+ chars)
- [ ] MongoDB has authentication enabled
- [ ] CORS domain whitelist configured
- [ ] HTTPS enforced (frontend → backend)
- [ ] Rate limiting configured (if needed)
- [ ] Error messages don't leak sensitive info

### Documentation
- [ ] All endpoints documented
- [ ] Error codes documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide ready
- [ ] Team trained on new system

---

## 🔧 Deployment Day Checklist

### Pre-Deployment
- [ ] Feature freeze applied
- [ ] All urgent bugs fixed
- [ ] All tests passing
- [ ] Backup of current database taken
- [ ] Rollback plan documented
- [ ] Team on standby

### Deployment Steps

#### Step 1: Code Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build (if applicable)
npm run build

# Verify code
npm run test

# Deploy (your method)
# - Docker: Build & push image
# - PM2: Stop old, start new
# - Vercel/Heroku: Push/deploy
```

**Verification:**
- [ ] Server starts without errors
- [ ] Routes registered successfully
- [ ] No database connection errors
- [ ] Background sync service initialized (logs should show)

#### Step 2: Database Migration
- [ ] Order model fields exist
- [ ] TrackingHistory collection created
- [ ] Indexes created

```javascript
// In MongoDB:
// Check Order model
db.orders.findOne()  // Should have awbNo, shippingStatus, etc.

// Check TrackingHistory exists
db.trackinghistories.stats()  // Should exist
```

**Verification:**
- [ ] No schema errors
- [ ] Existing orders still valid
- [ ] Backups working

#### Step 3: Configuration Verification
```bash
# In server logs, should see:
# [TRACKING SYNC] Starting background sync...
```

**Verification:**
- [ ] All env variables loaded
- [ ] Blue Dart credentials valid
- [ ] Tracking sync started (prod only)
- [ ] No configuration errors

#### Step 4: Health Check
```bash
# Test endpoint health
curl -X GET http://localhost:PORT/

# Test auth endpoint
curl -X GET http://localhost:PORT/api/users/profile \
  -H "Authorization: Bearer TOKEN"

# Quick endpoint test
curl -X GET http://localhost:PORT/api/orders/my-orders \
  -H "Authorization: Bearer TOKEN"
```

**Verification:**
- [ ] Server responds
- [ ] Auth working
- [ ] Orders endpoint working
- [ ] No 500 errors in logs

---

## 🧪 Post-Deployment Verification

### Immediate (5 minutes after deployment)
- [ ] Server is running
- [ ] No errors in logs
- [ ] Database connected
- [ ] Endpoints responding

### Short-term (30 minutes)
- [ ] Admin can access dashboard
- [ ] Can view pending orders
- [ ] Can test with demo data
- [ ] No errors in logs

### Medium-term (1 hour)
- [ ] Background sync ran once
- [ ] No database errors
- [ ] All logs clean
- [ ] Performance acceptable

### Full (24 hours)
- [ ] Multiple orders shipped successfully
- [ ] Tracking data cached properly
- [ ] Admin confirmed workflow works
- [ ] No error alerts triggered

---

## ⚠️ Rollback Plan

**If something goes wrong:**

### Option 1: Quick Rollback
```bash
# Stop current deployment
# Restore from git to last known good version
git revert <commit>
npm install
npm start
```

### Option 2: Database Rollback
```bash
# Restore from MongoDB backup
mongorestore --drop --archive=backup.archive
```

### Option 3: Full Rollback
```bash
# 1. Stop current server
# 2. Restore previous version
# 3. Restore previous database
# 4. Test thoroughly
# 5. Notify team
```

**When to rollback:**
- [ ] Database errors (migrations failed)
- [ ] Authentication broken (can't login)
- [ ] Critical endpoints return 500
- [ ] Data corruption detected
- [ ] Blue Dart API integration failing

---

## 📊 Post-Deployment Monitoring

### Logs to Monitor (Daily)
```
[AWB] - Waybill generation
[TRACKING] - Tracking updates
[TRACKING SYNC] - Background sync
[ERROR] - Any errors
```

### Key Metrics to Watch
- [ ] Orders created per day
- [ ] Shipments created per day
- [ ] AWB generation success rate
- [ ] Tracking sync success rate
- [ ] Error rate < 1%
- [ ] Response time < 1s

### Alerts to Configure
- [ ] Server down
- [ ] Database errors
- [ ] Blue Dart API errors
- [ ] Sync failures
- [ ] Unusual error spikes

---

## 🔐 Security Post-Deployment

### Verify Security
- [ ] HTTPS only (no HTTP)
- [ ] CORS headers correct
- [ ] JWT tokens valid
- [ ] No secrets exposed
- [ ] Rate limiting working
- [ ] Admin endpoints protected

### First Week Checks
- [ ] No SQL injection attempts
- [ ] No unauthorized access
- [ ] No data leaks
- [ ] No performance issues
- [ ] Backups working

---

## 📞 Rollout Phases (Recommended)

### Phase 1: Staging (Internal Testing)
**Duration:** 1-2 days
```
- Deploy to staging
- Internal team tests
- Admin team tests
- Basic order flow test
```

**Gates:**
- [ ] No critical errors
- [ ] All endpoints working
- [ ] Orders can be created
- [ ] Orders can be shipped
- [ ] Tracking works

### Phase 2: Beta (Limited Users)
**Duration:** 3-5 days
```
- Deploy to 1 region
- Limited user group
- Monitor closely
- Gather feedback
```

**Gates:**
- [ ] <100 orders processed
- [ ] No critical issues
- [ ] Performance good
- [ ] User feedback positive

### Phase 3: Full Release
**Duration:** Ongoing
```
- Deploy to all regions
- All users can use
- Full monitoring
- Support ready
```

**Gates:**
- [ ] Beta successful
- [ ] Support team trained
- [ ] Monitoring active
- [ ] Rollback plan ready

---

## 📋 Team Roles

### Deployment Lead
- [ ] Coordinates deployment
- [ ] Executes checklist
- [ ] Monitors rollout
- [ ] Handles incidents

### Database Admin
- [ ] Backup created
- [ ] Migration tested
- [ ] Restore plan ready
- [ ] Monitoring active

### Backend Team
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Logs configured
- [ ] Ready for support

### Admin Team
- [ ] Trained on new workflow
- [ ] Testing on staging
- [ ] Ready for production
- [ ] Feedback ready

### DevOps/Infra
- [ ] Servers ready
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Rollback ready

---

## 🚨 Incident Response

If issues occur:

### Level 1: Minor
- [ ] Document issue
- [ ] Inform team
- [ ] Monitor closely
- [ ] Plan fix

### Level 2: Moderate
- [ ] Alert team immediately
- [ ] Start rollback plan
- [ ] Communicate to users
- [ ] Begin investigation

### Level 3: Critical
- [ ] Activate incident response
- [ ] Stop accepting orders (if needed)
- [ ] Rollback immediately
- [ ] Post-incident review

---

## ✅ Final Sign-Off

### Before Going Live:
- [ ] All checklist items complete
- [ ] All tests passing
- [ ] All stakeholders aware
- [ ] Rollback plan ready
- [ ] Team trained
- [ ] Monitoring active

### Go-Live Approval:
- [ ] Backend lead: _______ (sign)
- [ ] DevOps lead: _______ (sign)
- [ ] Project manager: _______ (sign)
- [ ] Date: _________

### Post-Live Review:
- [ ] 24h review: _______ (sign)
- [ ] 1 week review: _______ (sign)
- [ ] Issues found: _________
- [ ] Improvements planned: _________

---

## 📚 Quick Reference

**Deployment command (varies by system):**
```bash
# Docker
docker build -t bluedart-backend:latest .
docker push YOUR_REGISTRY/bluedart-backend:latest
kubectl apply -f deployment.yaml

# PM2
pm2 stop bluedart-backend
pm2 delete bluedart-backend
pm2 start api/server.js --name bluedart-backend
pm2 save

# Vercel/Heroku
git push origin main
```

**Health check:**
```bash
curl http://localhost:9000/
# Should return: "Welcome Mwellnessbazar Its API"
```

**Verify blue dart:**
```bash
node test-bluedart.js
# Should show: ✓ JWT Token generated
# Should show: ✓ Connected to MongoDB
# Should show: ✓ Shipment routes loaded
```

---

**Status: Ready for Deployment** ✅

All items checked? Ready to deploy! 🚀
