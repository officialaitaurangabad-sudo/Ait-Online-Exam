const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Exam title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: [1, 'Must have at least 1 question'],
    max: [200, 'Cannot exceed 200 questions']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Must have at least 1 mark']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  allowedAttempts: {
    type: Number,
    default: 1,
    min: [1, 'Must allow at least 1 attempt'],
    max: [10, 'Cannot allow more than 10 attempts']
  },
  timeLimit: {
    type: Number, // in minutes
    default: null // null means no time limit
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  negativeMarking: {
    enabled: {
      type: Boolean,
      default: false
    },
    percentage: {
      type: Number,
      default: 0.25, // 25% of marks deducted for wrong answer
      min: [0, 'Negative marking percentage cannot be negative'],
      max: [1, 'Negative marking percentage cannot exceed 100%']
    }
  },
  proctoring: {
    enabled: {
      type: Boolean,
      default: false
    },
    fullScreen: {
      type: Boolean,
      default: false
    },
    tabSwitch: {
      type: Boolean,
      default: false
    },
    copyPaste: {
      type: Boolean,
      default: false
    }
  },
  accessControl: {
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedGroups: [String],
    password: String,
    ipRestrictions: [String]
  },
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for exam status
examSchema.virtual('isLive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual for exam availability
examSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         this.isActive && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual for time remaining
examSchema.virtual('timeRemaining').get(function() {
  if (!this.isLive) return 0;
  return Math.max(0, this.endDate - new Date());
});

// Indexes for better performance
examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1 });
examSchema.index({ subject: 1 });
examSchema.index({ category: 1 });
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ isActive: 1 });
examSchema.index({ tags: 1 });

// Pre-save middleware to validate dates
examSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  if (this.passingMarks > this.totalMarks) {
    next(new Error('Passing marks cannot exceed total marks'));
  }
  
  next();
});

// Static method to find live exams
examSchema.statics.findLiveExams = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

// Static method to find upcoming exams
examSchema.statics.findUpcomingExams = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    isActive: true,
    startDate: { $gt: now }
  });
};

// Static method to find exams by subject
examSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: new RegExp(subject, 'i') });
};

// Instance method to update analytics
examSchema.methods.updateAnalytics = function(result) {
  this.analytics.totalAttempts += 1;
  
  // Calculate new average score
  const totalScore = this.analytics.averageScore * (this.analytics.totalAttempts - 1) + result.score;
  this.analytics.averageScore = totalScore / this.analytics.totalAttempts;
  
  // Update pass rate
  const passed = result.score >= this.passingMarks ? 1 : 0;
  const totalPassed = this.analytics.passRate * (this.analytics.totalAttempts - 1) + passed;
  this.analytics.passRate = totalPassed / this.analytics.totalAttempts;
  
  return this.save();
};

module.exports = mongoose.model('Exam', examSchema);
