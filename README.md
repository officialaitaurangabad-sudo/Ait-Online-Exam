# AIT Online Exam Platform

A comprehensive online examination platform built with MERN stack, featuring separate student and admin panels with advanced analytics, timer functionality, bulk upload capabilities, and detailed reporting.

## 🚀 Features

### Student Features
- **Exam Dashboard**: View available exams, upcoming exams, and exam history
- **Real-time Timer**: Auto-submit when time expires
- **Question Navigation**: Easy navigation between questions
- **Instant Results**: View scores and detailed explanations
- **Progress Tracking**: Monitor performance over time
- **Responsive Design**: Works on all devices

### Admin/Teacher Features
- **Exam Management**: Create, edit, and manage exams
- **Question Bank**: Add questions individually or bulk upload
- **Analytics Dashboard**: Comprehensive performance analytics
- **Student Management**: View and manage student accounts
- **Reports Generation**: Detailed performance reports
- **Bulk Operations**: Import/export questions and results

### Technical Features
- **Secure Authentication**: JWT-based authentication with role-based access
- **Real-time Updates**: Live exam status and notifications
- **File Upload**: Support for images, documents, and bulk CSV/XLSX uploads
- **Email Notifications**: Automated result notifications
- **Advanced Analytics**: Charts and graphs for performance insights
- **Responsive UI**: Modern design with Tailwind CSS and Radix UI

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Recharts** for analytics and charts
- **React Router DOM** for routing
- **React Icons** for iconography
- **React Toastify** for notifications
- **Axios** for API calls
- **Zustand** for state management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email services
- **Winston** for logging
- **Cloudinary** for image storage

### Development Tools
- **ESLint** + **Prettier** for code quality
- **Concurrently** for running multiple processes
- **Morgan** for HTTP request logging
- **Nodemon** for development

## 📁 Project Structure

```
online-exam-platform/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Database and service configurations
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── middleware/     # Custom middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   ├── app.js          # Express app configuration
│   │   └── server.js       # Server entry point
│   ├── package.json
│   └── .env
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── routes/         # Route configurations
│   │   ├── store/          # State management
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   ├── package.json
│   └── vite.config.js
├── package.json            # Root package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-exam-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create `.env` files in both `backend/` and `frontend/` directories:
   
   **Backend `.env`:**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ait-exam-platform
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_EXPIRE=24h
   JWT_REFRESH_EXPIRE=7d
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Frontend URL
   CLIENT_URL=http://localhost:5173
   ```
   
   **Frontend `.env`:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=AIT Online Exam Platform
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:5173`

### Default Admin Account
After starting the server, you can create an admin account by registering with the role "admin" or by using the seed data script.

## 📱 Usage

### For Students
1. Register/Login to your account
2. View available exams on the dashboard
3. Click on an exam to start
4. Answer questions within the time limit
5. Submit and view results

### For Admins
1. Login with admin credentials
2. Create exams and add questions
3. Monitor student performance through analytics
4. Generate reports and manage the system

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Exams
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get exam by ID
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create new question
- `POST /api/questions/bulk` - Bulk upload questions
- `GET /api/questions/:id` - Get question by ID
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Results
- `POST /api/results` - Submit exam result
- `GET /api/results` - Get user results
- `GET /api/results/:id` - Get result by ID
- `GET /api/results/exam/:examId` - Get exam results

## 🎨 UI Components

The platform uses a comprehensive set of reusable components:

- **Common Components**: Navbar, Sidebar, Footer, Loader, ProtectedRoute
- **UI Components**: Button, Input, Select, Card, Modal, ProgressBar, Tabs, Tooltip, Timer
- **Dashboard Components**: Analytics charts, Report cards, Performance overview
- **Exam Components**: Exam list, Exam card, Instructions, Exam page, Result summary
- **Question Components**: Question card, Answer options, Explanation box, Bulk upload modal

## 📊 Analytics Features

- **Performance Charts**: Line charts, bar charts, and pie charts
- **Student Progress**: Track improvement over time
- **Exam Analytics**: Success rates, average scores, time analysis
- **Comparative Analysis**: Compare performance across different metrics

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure file upload handling

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
Make sure to set appropriate environment variables for production deployment.

### Database
Ensure MongoDB is properly configured and accessible in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by the AIT Development Team**
