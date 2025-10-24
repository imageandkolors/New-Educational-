# SmartEdu360 - Educational Platform with License Engine

A comprehensive educational management system built with Next.js, featuring a robust license engine for multi-school, multi-branch deployments with offline-first capabilities.

## 🚀 Features

### Core Platform
- **Multi-Role Support**: Admin, Teacher, Student, Parent, Bursar, Store Manager
- **Multi-School/Branch**: Hierarchical organization structure
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Responsive Design**: Mobile-first UI with Tailwind CSS

### License Engine
- **Offline-First**: Works without internet connection
- **Device Binding**: License tied to specific devices
- **Automatic Expiry**: Time-based license management
- **Grace Period**: Offline operation for limited time
- **Real-time Monitoring**: License usage and status tracking

### Mobile & Desktop Apps
- **Cross-Platform**: iOS, Android, and Desktop support via Capacitor
- **Progressive Web App (PWA)**: Installable web application
- **Offline Sync**: Automatic data synchronization when online
- **Native Features**: Camera, file system, notifications

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js 16 (API Routes, Server Actions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with custom auth system
- **Mobile**: Ionic + Capacitor
- **Deployment**: Vercel (Serverless)
- **License Engine**: Custom encryption and verification

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartedu360
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/smartedu360"
   NEXTAUTH_SECRET="your-secret-key"
   JWT_SECRET="your-jwt-secret"
   LICENSE_ENCRYPTION_KEY="your-encryption-key"
   ```

4. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   Set these in Vercel dashboard:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Authentication secret
   - `JWT_SECRET` - JWT signing secret
   - `LICENSE_ENCRYPTION_KEY` - License encryption key

### Database Setup (Production)

For production, use Vercel Postgres or any PostgreSQL provider:

```bash
# With Vercel Postgres
vercel postgres create

# Run migrations
npm run db:migrate
```

## 📱 Mobile App Setup

### iOS

1. **Add iOS platform**
   ```bash
   npm run capacitor:add:ios
   ```

2. **Build and sync**
   ```bash
   npm run capacitor:build
   ```

3. **Open in Xcode**
   ```bash
   npx cap open ios
   ```

### Android

1. **Add Android platform**
   ```bash
   npm run capacitor:add:android
   ```

2. **Build and sync**
   ```bash
   npm run capacitor:build
   ```

3. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

## 🔐 License System

### Creating Licenses

Admins can create licenses through the dashboard:

1. Navigate to **Dashboard > License Management**
2. Click **Create License**
3. Fill in school, branch, and expiry details
4. License key is automatically generated

### License Verification

The system supports both online and offline verification:

- **Online**: Real-time validation with server
- **Offline**: Local validation with grace period
- **Auto-sync**: Seamless transition between modes

### License Key Format

```
SCHOOL-BRANCH-TIMESTAMP-RANDOM-HASH
Example: EDU360-MAIN-ABC123-XYZ789-HASH12
```

## 👥 User Roles & Permissions

### Admin
- Manage schools and branches
- Create and manage licenses
- User management
- System analytics
- Settings configuration

### Teacher
- Manage classes and students
- Create assignments
- Grade submissions
- View reports

### Student
- View assignments and grades
- Submit work
- Access course materials
- View schedule

### Parent
- Monitor child progress
- View grades and attendance
- Communicate with teachers
- Access reports

### Bursar
- Financial management
- Fee collection
- Payment processing
- Financial reports

### Store Manager
- Inventory management
- Order processing
- Supplier management
- Stock reports

## 🔄 Offline Sync

The platform includes robust offline synchronization:

- **Automatic**: Syncs when connection is available
- **Conflict Resolution**: Handles data conflicts intelligently
- **Queue Management**: Stores changes locally until sync
- **Status Indicators**: Shows sync status to users

## 🛡 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Granular permission system
- **License Encryption**: Secure license validation
- **Rate Limiting**: API protection
- **Audit Logging**: Complete activity tracking

## 📊 Monitoring & Analytics

- **License Usage**: Real-time license monitoring
- **User Activity**: Comprehensive audit logs
- **System Health**: Performance metrics
- **Expiry Alerts**: Proactive notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔮 Roadmap

- [ ] Advanced reporting system
- [ ] Real-time notifications
- [ ] Video conferencing integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API documentation
- [ ] Automated testing suite

---

Built with ❤️ using Next.js, React, and modern web technologies.