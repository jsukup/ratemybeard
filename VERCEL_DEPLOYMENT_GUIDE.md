# RateMyBeard Vercel Deployment Guide

This guide will help you deploy RateMyBeard to Vercel with the custom domain `ratemybeard.net`.

## Prerequisites

- Completed Supabase database setup (see `SUPABASE_DATABASE_SETUP.md`)
- Domain `ratemybeard.net` registered and accessible
- GitHub repository with the RateMyBeard code

## Step 1: Prepare Repository

1. Ensure all code changes are committed and pushed to your GitHub repository
2. Verify the `vercel.json` configuration is correct:

```json
{
  "version": 2,
  "buildCommand": "npm run build:shared && cd web && npm run build",
  "outputDirectory": "web/.next",
  "installCommand": "npm install",
  "devCommand": "cd web && npm run dev",
  "framework": "nextjs"
}
```

## Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your RateMyBeard GitHub repository
4. Configure project settings:
   - **Project Name**: `ratemybeard`
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default for monorepo)
   - **Build Command**: `npm run build:shared && cd web && npm run build`
   - **Output Directory**: `web/.next`
   - **Install Command**: `npm install`

## Step 3: Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-new-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-new-anon-key]
```

### Optional Variables

```env
# Admin password for admin routes (change this!)
ADMIN_PASSWORD=ratemybeard2025secure

# Google Analytics (if you want tracking)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Stripe (if you plan to add payments later)
STRIPE_SECRET_KEY=sk_test_...
ENABLE_PAYMENTS=false
```

### Setting Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings**
3. Click **Environment Variables**
4. Add each variable for:
   - **Production** (required)
   - **Preview** (recommended)
   - **Development** (optional)

## Step 4: Custom Domain Configuration

### 4.1 Add Domain to Vercel

1. In your Vercel project, go to **Settings** > **Domains**
2. Click **Add Domain**
3. Enter `ratemybeard.net`
4. Click **Add**
5. Also add `www.ratemybeard.net` and set it to redirect to `ratemybeard.net`

### 4.2 DNS Configuration

Vercel will provide DNS records. Configure your domain registrar with these records:

**For apex domain (ratemybeard.net):**
```
Type: A
Name: @
Value: 76.76.19.61
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Alternative (if your registrar supports ALIAS/ANAME records):**
```
Type: ALIAS/ANAME
Name: @
Value: cname.vercel-dns.com
```

### 4.3 SSL Certificate

Vercel will automatically provision SSL certificates for your custom domain. This may take a few minutes to complete.

## Step 5: Build and Deploy

1. Once domain and environment variables are configured, trigger a deployment:
   - Push a commit to your main branch, or
   - Click **Redeploy** in the Vercel dashboard

2. Monitor the build process in the Vercel dashboard

## Step 6: Post-Deployment Verification

### 6.1 Test Core Functionality

Visit `https://ratemybeard.net` and verify:

- [ ] Page loads correctly with new branding
- [ ] Logo displays properly (should show beard logo)
- [ ] Camera capture works
- [ ] Image upload functions
- [ ] Leaderboard displays (may be empty initially)
- [ ] Database connection is successful

### 6.2 Test Database Integration

1. Try uploading a test image
2. Verify it appears in your Supabase dashboard under the `images` table
3. Try rating the image
4. Check that ratings appear in the `ratings` table

### 6.3 Test Mobile Responsiveness

- Test on mobile devices
- Verify responsive layout works
- Check camera functionality on mobile

## Step 7: Performance Optimization

### 7.1 Enable Analytics

If you added Google Analytics:
1. Verify tracking is working
2. Set up conversion goals
3. Monitor Core Web Vitals

### 7.2 Image Optimization

Vercel automatically optimizes images, but verify:
- Images load quickly
- Proper format conversion (WebP when supported)
- Responsive image loading

## Step 8: Monitoring and Maintenance

### 8.1 Set Up Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Uptime Monitoring**: Consider tools like UptimeRobot
3. **Error Tracking**: Monitor Vercel function logs
4. **Database Monitoring**: Use Supabase dashboard metrics

### 8.2 Regular Tasks

- Monitor storage usage in Supabase
- Check database performance
- Review error logs
- Update dependencies regularly

## Troubleshooting

### Common Issues

**Build Fails:**
- Check build command is correct
- Verify all dependencies are in package.json
- Review build logs for specific errors

**Domain Not Working:**
- DNS changes can take up to 48 hours
- Use DNS propagation checker tools
- Verify DNS records are correct

**Environment Variables Not Loading:**
- Ensure variables are set for correct environment
- Redeploy after adding new variables
- Check variable names match exactly

**Database Connection Issues:**
- Verify Supabase URL and key are correct
- Check Supabase project is not paused
- Review RLS policies

**Images Not Loading:**
- Check Supabase storage bucket is public
- Verify storage policies allow read access
- Confirm image URLs are correct format

### Performance Issues

**Slow Loading:**
- Optimize images before upload
- Consider CDN for static assets
- Review database query performance

**High Database Usage:**
- Monitor active connections
- Optimize database queries
- Consider connection pooling

## Security Checklist

- [ ] Environment variables properly secured
- [ ] Admin passwords changed from defaults
- [ ] RLS policies properly configured
- [ ] Storage policies reviewed
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] No sensitive data in client code

## Scaling Considerations

As your app grows, consider:

1. **Database**: Upgrade Supabase plan if needed
2. **Storage**: Monitor image storage limits
3. **Bandwidth**: Vercel has bandwidth limits on free tier
4. **Function Limits**: API routes have execution time limits
5. **CDN**: Consider separate CDN for high-traffic images

## Backup Strategy

1. **Database**: Enable Supabase automatic backups
2. **Code**: Regular GitHub commits
3. **Images**: Consider additional backup storage
4. **Environment**: Document all configuration

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: Community support
- **GitHub Issues**: For code-related problems
- **Supabase Docs**: https://supabase.com/docs

## Example Deployment Checklist

Before going live:

- [ ] Database fully migrated and tested
- [ ] All environment variables configured
- [ ] Custom domain configured with SSL
- [ ] Test image upload and rating flow
- [ ] Mobile responsiveness verified
- [ ] Performance metrics acceptable
- [ ] Error handling tested
- [ ] Admin functionality tested
- [ ] Analytics configured
- [ ] Backup strategy in place

Your RateMyBeard application should now be fully deployed and accessible at `https://ratemybeard.net`!

## Post-Launch

After successful deployment:

1. **Marketing**: Announce the launch
2. **SEO**: Submit sitemap to search engines
3. **Social Media**: Update all social profiles
4. **Monitoring**: Keep an eye on metrics and errors
5. **User Feedback**: Collect and iterate based on feedback

Congratulations on your successful deployment!