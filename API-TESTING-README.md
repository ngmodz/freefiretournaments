# 🧪 FreeFire Tournaments API Testing Suite

This directory contains a comprehensive API testing suite for the FreeFire Tournaments application. These tests will help you monitor the health of your app and identify any broken functionalities.

## 🚀 Quick Start

### Option 1: NPM Scripts (Recommended)
```bash
# Quick health check (30 seconds)
npm run health:quick

# Full comprehensive test (2-3 minutes)
npm run health:full

# Simple API test
npm run health:simple
```

### Option 2: Direct Script Execution
```bash
# Quick one-liner health check
node quick-health-check.js

# Full comprehensive test with detailed report
node final-api-test.js

# Simple test without detailed analysis
node simple-api-test.js
```

### Option 3: Batch Files (Windows)
```bash
# Run using the provided batch file
run-api-tests.bat

# Or PowerShell
.\run-api-tests.ps1
```

## 📋 What Gets Tested

### Core Systems
- ✅ **Health Check API** - Basic system status
- ✅ **Email System** - Contact forms, notifications
- ✅ **Payment System** - Order creation, verification, webhooks
- ✅ **Tournament System** - Tournament management
- ✅ **Financial Operations** - Withdrawals
- ✅ **Infrastructure** - CORS, routing, error handling

### Specific Tests
1. **Email Service Tests**
   - Contact form submissions
   - Withdrawal request notifications
   - Withdrawal processed notifications
   - General email functionality

2. **Payment System Tests**
   - Cashfree payment order creation
   - Payment verification
   - Webhook processing

3. **Tournament Tests**
   - Tournament check and notification system
   - Tournament cancellation (with auth)

4. **Financial Tests**
   - Withdrawal fund requests

5. **Infrastructure Tests**
   - CORS support
   - HTTP method validation
   - Error handling

## 📊 Understanding the Results

### Health Scores
- **90-100%**: Excellent - All systems operational
- **70-89%**: Good - Minor issues
- **50-69%**: Needs Attention - Multiple issues
- **Below 50%**: Critical - Major problems

### Status Indicators
- ✅ **WORKING** - API is functioning correctly
- ❌ **BROKEN** - API has issues that need fixing
- ⚠️ **WARNING** - Configuration issues detected

## 🔧 Common Issues and Fixes

### Email Service Issues
If email tests fail:
1. Check email credentials in `.env` file
2. Verify SMTP settings
3. Ensure required fields are provided

### Payment Service Issues
If payment tests fail:
1. Check Cashfree credentials
2. Verify API environment (SANDBOX/PRODUCTION)
3. Check network connectivity

### Firebase Issues
If Firebase tests fail:
1. Verify Firebase configuration
2. Check service account permissions
3. Ensure proper authentication

## 📁 File Overview

- `final-api-test.js` - Comprehensive test with detailed analysis
- `simple-api-test.js` - Basic API functionality tests
- `quick-health-check.js` - Fast 30-second health check
- `comprehensive-api-test.js` - Full test with Firebase operations
- `quick-diagnostic.js` - Detailed diagnostic tool
- `run-api-tests.bat` - Windows batch file runner
- `run-api-tests.ps1` - PowerShell runner
- `API-HEALTH-REPORT.md` - Latest health report
- `.env.test` - Test configuration file

## ⚙️ Configuration

### Environment Variables
The tests use the same environment variables as your main application:
- `API_URL` - Your app's base URL
- `VITE_FIREBASE_*` - Firebase configuration
- `CASHFREE_*` - Payment configuration
- `EMAIL_*` - Email service configuration

### Test Configuration
Modify `TEST_CONFIG` in any test file to customize:
- Test email addresses
- Test phone numbers
- Verbose output settings
- Cleanup behavior

## 🤖 Automation

### CI/CD Integration
Add to your CI/CD pipeline:
```yaml
- name: API Health Check
  run: npm run health:full
```

### Monitoring
Set up scheduled health checks:
```bash
# Run every hour
0 * * * * cd /path/to/project && npm run health:quick

# Full check daily
0 9 * * * cd /path/to/project && npm run health:full
```

## 🆘 Troubleshooting

### Common Error Messages

**"Missing or insufficient permissions"**
- Firebase security rules are too restrictive
- Service account needs proper permissions

**"Email service not configured"**
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Gmail app password is correct

**"Payment API broken"**
- Verify Cashfree credentials
- Check if sandbox/production environment is correct

**"Network timeout"**
- Check internet connection
- Verify API URL is accessible

### Getting Help
1. Check the latest `API-HEALTH-REPORT.md` for detailed analysis
2. Run `node quick-diagnostic.js` for specific issue details
3. Enable verbose logging in test configuration
4. Check individual API endpoints manually

## 📈 Regular Maintenance

### Recommended Schedule
- **Daily**: Quick health check (`npm run health:quick`)
- **Weekly**: Full comprehensive test (`npm run health:full`)
- **Before deployments**: Always run full test suite
- **After major changes**: Run comprehensive tests

### Best Practices
1. Fix critical issues immediately (payment, authentication)
2. Address warnings before they become errors
3. Monitor health score trends over time
4. Keep test dependencies updated

---

**Last Updated**: July 16, 2025  
**Current Health Score**: 92.3% ✅  
**Status**: All critical systems operational
