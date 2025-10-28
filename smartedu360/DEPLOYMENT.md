# SmartEdu360 Deployment Guide

## Quick Start with Vercel

### 1. Prerequisites
- Vercel account
- PostgreSQL database (Vercel Postgres recommended)
- GitHub repository

### 2. One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/smartedu360)

### 3. Manual Deployment

#### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd smartedu360
npm install --legacy-peer-deps
```

#### Step 2: Environment Variables
Create these environment variables in Vercel:

```env
DATABASE_URL=postgresql://username:password@host:5432/database
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
JWT_SECRET=your-jwt-secret-32-chars-min
LICENSE_ENCRYPTION_KEY=your-license-key-32-chars-min
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### Step 3: Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

#### Step 4: Deploy
```bash
vercel --prod
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Random 32+ character string |
| `JWT_SECRET` | JWT signing secret | Random 32+ character string |
| `LICENSE_ENCRYPTION_KEY` | License encryption key | Random 32+ character string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `APP_NAME` | Application name | `SmartEdu360` |
| `APP_VERSION` | Application version | `1.0.0` |

## Database Setup

### Using Vercel Postgres

1. **Create Database**
   ```bash
   vercel postgres create smartedu360-db
   ```

2. **Get Connection String**
   ```bash
   vercel env pull .env.local
   ```

3. **Run Migrations**
   ```bash
   npm run db:push
   ```

### Using External PostgreSQL

1. Create a PostgreSQL database
2. Set `DATABASE_URL` environment variable
3. Run migrations:
   ```bash
   npm run db:push
   ```

## Post-Deployment Setup

### 1. Create Admin User

After deployment, create the first admin user by running this SQL:

```sql
INSERT INTO users (
  id, branch_id, email, first_name, last_name, 
  password, role, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM branches LIMIT 1),
  'admin@smartedu360.com',
  'System',
  'Administrator',
  '$2a$12$LQv3c1yqBwlVHpPjrCeyL.rVwnSBsCvcB5.hlMhEjwwGpsOwuTXdC', -- 'password'
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

### 2. Create Initial School and Branch

```sql
-- Create school
INSERT INTO schools (id, name, code, created_at, updated_at)
VALUES (gen_random_uuid(), 'Demo School', 'DEMO', NOW(), NOW());

-- Create branch
INSERT INTO branches (id, school_id, name, code, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools WHERE code = 'DEMO'),
  'Main Campus',
  'MAIN',
  true,
  NOW(),
  NOW()
);
```

### 3. Create Initial License

Use the admin dashboard to create the first license, or run:

```sql
INSERT INTO licenses (
  id, school_id, branch_id, license_key, status, 
  max_users, current_users, expires_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools WHERE code = 'DEMO'),
  (SELECT id FROM branches WHERE code = 'MAIN'),
  'DEMO-MAIN-2024-INIT-ABCD1234',
  'ACTIVE',
  100,
  0,
  '2025-12-31 23:59:59',
  NOW(),
  NOW()
);
```

## Mobile App Deployment

### iOS App Store

1. **Build for iOS**
   ```bash
   npm run capacitor:build
   npx cap open ios
   ```

2. **Configure in Xcode**
   - Set bundle identifier
   - Configure signing
   - Set deployment target (iOS 13+)

3. **Build and Upload**
   - Archive in Xcode
   - Upload to App Store Connect
   - Submit for review

### Google Play Store

1. **Build for Android**
   ```bash
   npm run capacitor:build
   npx cap open android
   ```

2. **Configure in Android Studio**
   - Set application ID
   - Configure signing
   - Set minimum SDK (API 24+)

3. **Build and Upload**
   - Generate signed APK/AAB
   - Upload to Google Play Console
   - Submit for review

## Monitoring and Maintenance

### Health Checks

The application includes health check endpoints:

- `/api/health` - Basic health check
- `/api/health/db` - Database connectivity
- `/api/health/license` - License system status

### Logging

Logs are available in Vercel dashboard:
- Function logs
- Build logs
- Edge logs

### Performance Monitoring

Monitor these metrics:
- Response times
- Error rates
- License usage
- Database performance

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify database is accessible
   - Check firewall settings

2. **License Verification Failed**
   - Verify `LICENSE_ENCRYPTION_KEY`
   - Check license key format
   - Ensure system time is correct

3. **Build Failed**
   - Check Node.js version (18+)
   - Clear cache: `npm ci --legacy-peer-deps`
   - Check environment variables

### Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Review application logs

## Security Considerations

### Production Checklist

- [ ] Use strong, unique secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor access logs

### Environment Security

- Never commit secrets to version control
- Use Vercel environment variables
- Rotate secrets regularly
- Monitor for unauthorized access
- Set up alerts for failed logins

---

For additional support, please refer to the main README.md or create an issue on GitHub.