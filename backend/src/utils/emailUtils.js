const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to AIT Online Exam Platform';
  const text = `
    Welcome ${user.firstName}!
    
    Thank you for registering with AIT Online Exam Platform.
    
    Your account has been created successfully.
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to AIT Online Exam Platform</h2>
      <p>Hello ${user.firstName},</p>
      <p>Thank you for registering with AIT Online Exam Platform.</p>
      <p>Your account has been created successfully and you can now:</p>
      <ul>
        <li>Take online exams</li>
        <li>View your results</li>
        <li>Track your progress</li>
        <li>Access study materials</li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send email verification email
const sendEmailVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify Your Email Address';
  const text = `
    Hello ${user.firstName},
    
    Please verify your email address by clicking the link below:
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Verify Your Email Address</h2>
      <p>Hello ${user.firstName},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request';
  const text = `
    Hello ${user.firstName},
    
    You requested a password reset. Please click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hello ${user.firstName},</p>
      <p>You requested a password reset. Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send exam result email
const sendExamResultEmail = async (user, exam, result) => {
  const resultUrl = `${process.env.CLIENT_URL}/results/${result._id}`;
  
  const subject = `Exam Result: ${exam.title}`;
  const text = `
    Hello ${user.firstName},
    
    Your exam "${exam.title}" has been completed.
    
    Result Summary:
    - Score: ${result.obtainedMarks}/${result.totalMarks}
    - Percentage: ${result.percentage.toFixed(2)}%
    - Grade: ${result.grade}
    - Status: ${result.isPassed ? 'Passed' : 'Failed'}
    
    View detailed results: ${resultUrl}
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Exam Result: ${exam.title}</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your exam "${exam.title}" has been completed.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Result Summary</h3>
        <p><strong>Score:</strong> ${result.obtainedMarks}/${result.totalMarks}</p>
        <p><strong>Percentage:</strong> ${result.percentage.toFixed(2)}%</p>
        <p><strong>Grade:</strong> ${result.grade}</p>
        <p><strong>Status:</strong> 
          <span style="color: ${result.isPassed ? '#16a34a' : '#dc2626'};">
            ${result.isPassed ? 'Passed' : 'Failed'}
          </span>
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resultUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Detailed Results
        </a>
      </div>
      
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send exam reminder email
const sendExamReminderEmail = async (user, exam) => {
  const examUrl = `${process.env.CLIENT_URL}/exams/${exam._id}`;
  
  const subject = `Exam Reminder: ${exam.title}`;
  const text = `
    Hello ${user.firstName},
    
    This is a reminder that you have an upcoming exam.
    
    Exam Details:
    - Title: ${exam.title}
    - Subject: ${exam.subject}
    - Duration: ${exam.duration} minutes
    - Start Date: ${new Date(exam.startDate).toLocaleDateString()}
    - End Date: ${new Date(exam.endDate).toLocaleDateString()}
    
    Take the exam: ${examUrl}
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Exam Reminder: ${exam.title}</h2>
      <p>Hello ${user.firstName},</p>
      <p>This is a reminder that you have an upcoming exam.</p>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Exam Details</h3>
        <p><strong>Title:</strong> ${exam.title}</p>
        <p><strong>Subject:</strong> ${exam.subject}</p>
        <p><strong>Duration:</strong> ${exam.duration} minutes</p>
        <p><strong>Start Date:</strong> ${new Date(exam.startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(exam.endDate).toLocaleDateString()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${examUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Take Exam
        </a>
      </div>
      
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send exam start notification email
const sendExamStartNotificationEmail = async (user, exam) => {
  const examUrl = `${process.env.CLIENT_URL}/exam/${exam._id}`;
  
  const subject = `Exam Started: ${exam.title}`;
  const text = `
    Hello ${user.firstName},
    
    You have started the exam "${exam.title}".
    
    Exam Details:
    - Title: ${exam.title}
    - Subject: ${exam.subject}
    - Duration: ${exam.duration} minutes
    - Total Questions: ${exam.totalQuestions}
    - Total Marks: ${exam.totalMarks}
    
    Continue your exam: ${examUrl}
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Exam Started: ${exam.title}</h2>
      <p>Hello ${user.firstName},</p>
      <p>You have started the exam "${exam.title}".</p>
      
      <div style="background-color: #dbeafe; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Exam Details</h3>
        <p><strong>Title:</strong> ${exam.title}</p>
        <p><strong>Subject:</strong> ${exam.subject}</p>
        <p><strong>Duration:</strong> ${exam.duration} minutes</p>
        <p><strong>Total Questions:</strong> ${exam.totalQuestions}</p>
        <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${examUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Continue Exam
        </a>
      </div>
      
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send exam deadline warning email
const sendExamDeadlineWarningEmail = async (user, exam, hoursRemaining) => {
  const examUrl = `${process.env.CLIENT_URL}/exam/${exam._id}`;
  
  const subject = `Exam Deadline Warning: ${exam.title}`;
  const text = `
    Hello ${user.firstName},
    
    This is a reminder that your exam "${exam.title}" will end in ${hoursRemaining} hours.
    
    Exam Details:
    - Title: ${exam.title}
    - Subject: ${exam.subject}
    - End Time: ${new Date(exam.endDate).toLocaleString()}
    
    Complete your exam: ${examUrl}
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Exam Deadline Warning: ${exam.title}</h2>
      <p>Hello ${user.firstName},</p>
      <p>This is a reminder that your exam "${exam.title}" will end in <strong>${hoursRemaining} hours</strong>.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="margin-top: 0; color: #dc2626;">Exam Details</h3>
        <p><strong>Title:</strong> ${exam.title}</p>
        <p><strong>Subject:</strong> ${exam.subject}</p>
        <p><strong>End Time:</strong> ${new Date(exam.endDate).toLocaleString()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${examUrl}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Complete Exam Now
        </a>
      </div>
      
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send exam announcement email
const sendExamAnnouncementEmail = async (user, exam) => {
  const examUrl = `${process.env.CLIENT_URL}/exam/${exam._id}`;
  
  const subject = `New Exam Available: ${exam.title}`;
  const text = `
    Hello ${user.firstName},
    
    A new exam has been made available for you.
    
    Exam Details:
    - Title: ${exam.title}
    - Subject: ${exam.subject}
    - Duration: ${exam.duration} minutes
    - Start Date: ${new Date(exam.startDate).toLocaleDateString()}
    - End Date: ${new Date(exam.endDate).toLocaleDateString()}
    - Total Questions: ${exam.totalQuestions}
    - Total Marks: ${exam.totalMarks}
    
    Take the exam: ${examUrl}
    
    Best regards,
    AIT Exam Platform Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Exam Available: ${exam.title}</h2>
      <p>Hello ${user.firstName},</p>
      <p>A new exam has been made available for you.</p>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Exam Details</h3>
        <p><strong>Title:</strong> ${exam.title}</p>
        <p><strong>Subject:</strong> ${exam.subject}</p>
        <p><strong>Duration:</strong> ${exam.duration} minutes</p>
        <p><strong>Start Date:</strong> ${new Date(exam.startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(exam.endDate).toLocaleDateString()}</p>
        <p><strong>Total Questions:</strong> ${exam.totalQuestions}</p>
        <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${examUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Take Exam
        </a>
      </div>
      
      <p>Best regards,<br>AIT Exam Platform Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    text,
    html
  });
};

// Send bulk email
const sendBulkEmail = async (recipients, subject, text, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
      bcc: recipients.join(','),
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Bulk email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Bulk email sending failed:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendExamResultEmail,
  sendExamReminderEmail,
  sendExamStartNotificationEmail,
  sendExamDeadlineWarningEmail,
  sendExamAnnouncementEmail,
  sendBulkEmail
};
