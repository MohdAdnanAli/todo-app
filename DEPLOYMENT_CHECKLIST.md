# Deployment Checklist

## Pre-Deployment

### Backend Setup
- [ ] Run `bun install` or `npm install` in `api/` directory
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required environment variables:
  - [ ] `MONGODB_URI` - MongoDB connection string
  - [ ] `JWT_SECRET` - Strong random string (min 32 chars)
  - [ ] `FRONTEND_URL` - Frontend URL for email links
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
  - [ ] `SMTP_FROM` - Sender email address
- [ ] Test MongoDB connection
- [ ] Test email sending (send test email)
- [ ] Verify all dependencies installed: `bun run api/index.ts`

### Frontend Setup
- [ ] Run `bun install` or `npm install` in `frontend/` directory
- [ ] Create new pages:
  - [ ] `VerifyEmail.tsx`
  - [ ] `ForgotPassword.tsx`
  - [ ] `ResetPassword.tsx`
  - [ ] `Profile.tsx`
- [ ] Add routes to router
- [ ] Update login/register forms with new links
- [ ] Add password strength indicator component
- [ ] Test all new pages locally

### Security Review
- [ ] Verify JWT_SECRET is strong (min 32 chars, random)
- [ ] Verify SMTP credentials are correct
- [ ] Check CORS configuration matches deployment domains
- [ ] Verify secure cookie flags for production
- [ ] Review rate limiting thresholds
- [ ] Check password strength requirements

## Testing

### Backend Testing
- [ ] Test registration with weak password (should fail)
- [ ] Test registration with strong password (should succeed)
- [ ] Test email verification link
- [ ] Test login with correct credentials
- [ ] Test login with incorrect credentials
- [ ] Test account lockout after 5 failed attempts
- [ ] Test rate limiting on login (6 attempts in 1 min)
- [ ] Test rate limiting on registration (6 in 1 hour)
- [ ] Test password reset flow
- [ ] Test profile update
- [ ] Test profile retrieval
- [ ] Test todo CRUD with categories/tags/priority
- [ ] Test protected routes without auth
- [ ] Test logout

### Frontend Testing
- [ ] Test registration form validation
- [ ] Test password strength indicator
- [ ] Test email verification page
- [ ] Test forgot password page
- [ ] Test reset password page
- [ ] Test profile page
- [ ] Test profile update
- [ ] Test error messages for rate limiting
- [ ] Test error messages for account lockout
- [ ] Test todo creation with categories/tags
- [ ] Test todo display with new fields
- [ ] Test responsive design on mobile

### Integration Testing
- [ ] Register new account
- [ ] Verify email from link
- [ ] Login with verified account
- [ ] Update profile
- [ ] Create todo with category/tags
- [ ] Logout
- [ ] Request password reset
- [ ] Reset password
- [ ] Login with new password

## Deployment to Vercel

### Backend (API)
- [ ] Push code to GitHub
- [ ] Create Vercel project for API
- [ ] Configure environment variables in Vercel:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `FRONTEND_URL` (Vercel frontend URL)
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - [ ] `SMTP_FROM`
  - [ ] `NODE_ENV=production`
- [ ] Deploy to Vercel
- [ ] Test health endpoint: `GET /health`
- [ ] Test API endpoints with Vercel URL

### Frontend
- [ ] Push code to GitHub
- [ ] Create Vercel project for frontend
- [ ] Configure environment variables:
  - [ ] `VITE_API_URL` (Vercel API URL)
- [ ] Deploy to Vercel
- [ ] Test all pages
- [ ] Test API integration with Vercel backend

### Post-Deployment
- [ ] Verify CORS works between frontend and backend
- [ ] Test email sending in production
- [ ] Monitor error logs
- [ ] Test rate limiting in production
- [ ] Verify secure cookies are set
- [ ] Check JWT tokens are working

## Monitoring

### Ongoing
- [ ] Monitor failed login attempts
- [ ] Monitor rate limiting effectiveness
- [ ] Check email delivery logs
- [ ] Review error logs daily
- [ ] Monitor database performance
- [ ] Check JWT token usage

### Alerts to Set Up
- [ ] High number of failed login attempts
- [ ] Rate limiting triggered frequently
- [ ] Email sending failures
- [ ] Database connection errors
- [ ] API response time degradation

## Maintenance

### Weekly
- [ ] Review security logs
- [ ] Check for failed email deliveries
- [ ] Monitor rate limiting stats
- [ ] Review error logs

### Monthly
- [ ] Update dependencies
- [ ] Review security best practices
- [ ] Audit user accounts
- [ ] Check backup status

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] Update documentation

## Rollback Plan

If issues occur:
1. [ ] Identify the problem
2. [ ] Check error logs
3. [ ] Revert to previous version if needed
4. [ ] Notify users if necessary
5. [ ] Document the issue
6. [ ] Implement fix
7. [ ] Test thoroughly
8. [ ] Redeploy

## Documentation

- [ ] Update README with new features
- [ ] Document API changes
- [ ] Create user guide for new features
- [ ] Document deployment process
- [ ] Create troubleshooting guide

## Security Hardening (Post-Launch)

- [ ] Implement CAPTCHA for registration
- [ ] Add two-factor authentication
- [ ] Implement session management
- [ ] Add audit logging
- [ ] Implement password history
- [ ] Add email change verification
- [ ] Implement account deletion
- [ ] Add suspicious activity alerts

## Performance Optimization (Post-Launch)

- [ ] Implement caching
- [ ] Optimize database queries
- [ ] Add pagination for todos
- [ ] Implement search functionality
- [ ] Add database indexing
- [ ] Monitor and optimize API response times

## Compliance (Post-Launch)

- [ ] Review GDPR compliance
- [ ] Implement data export
- [ ] Implement account deletion
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Implement cookie consent

---

**Deployment Status**: Ready for Testing
**Estimated Time to Deploy**: 2-3 hours
**Estimated Time to Test**: 4-6 hours
