const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: mongoose.Schema.Types.Mixed, // Can be string, array, or object
      default: null
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    marksObtained: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    isMarkedForReview: {
      type: Boolean,
      default: false
    }
  }],
  totalMarks: {
    type: Number,
    required: true
  },
  obtainedMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    default: 'F'
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'submitted', 'auto-submitted', 'abandoned'],
    default: 'in-progress'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  passingMarks: {
    type: Number,
    required: true
  },
  rank: {
    type: Number
  },
  percentile: {
    type: Number
  },
  analytics: {
    correctAnswers: {
      type: Number,
      default: 0
    },
    wrongAnswers: {
      type: Number,
      default: 0
    },
    unansweredQuestions: {
      type: Number,
      default: 0
    },
    markedForReview: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0
    },
    averageTimePerQuestion: {
      type: Number,
      default: 0
    },
    fastestAnswer: {
      type: Number,
      default: 0
    },
    slowestAnswer: {
      type: Number,
      default: 0
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      maxlength: [1000, 'Feedback comments cannot exceed 1000 characters']
    },
    difficulty: {
      type: String,
      enum: ['very-easy', 'easy', 'medium', 'hard', 'very-hard']
    },
    suggestions: {
      type: String,
      maxlength: [1000, 'Suggestions cannot exceed 1000 characters']
    }
  },
  proctoringData: {
    tabSwitches: {
      type: Number,
      default: 0
    },
    fullScreenExits: {
      type: Number,
      default: 0
    },
    suspiciousActivity: [{
      type: String,
      timestamp: Date,
      description: String
    }],
    screenshots: [{
      publicId: String,
      url: String,
      timestamp: Date
    }]
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewComments: String,
  isDisqualified: {
    type: Boolean,
    default: false
  },
  disqualificationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for exam duration
resultSchema.virtual('examDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / 1000 / 60); // in minutes
  }
  return 0;
});

// Virtual for performance level
resultSchema.virtual('performanceLevel').get(function() {
  if (this.percentage >= 90) return 'Excellent';
  if (this.percentage >= 80) return 'Very Good';
  if (this.percentage >= 70) return 'Good';
  if (this.percentage >= 60) return 'Average';
  if (this.percentage >= 50) return 'Below Average';
  return 'Poor';
});

// Indexes for better performance
resultSchema.index({ exam: 1, student: 1 });
resultSchema.index({ student: 1 });
resultSchema.index({ exam: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ createdAt: -1 });
resultSchema.index({ obtainedMarks: -1 });
resultSchema.index({ percentage: -1 });

// Compound index for unique attempt per exam
resultSchema.index({ exam: 1, student: 1, attemptNumber: 1 }, { unique: true });

// Pre-save middleware to calculate analytics
resultSchema.pre('save', function(next) {
  if (this.answers && this.answers.length > 0) {
    // Calculate analytics
    this.analytics.correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
    this.analytics.wrongAnswers = this.answers.filter(answer => answer.isAnswered && !answer.isCorrect).length;
    this.analytics.unansweredQuestions = this.answers.filter(answer => !answer.isAnswered).length;
    this.analytics.markedForReview = this.answers.filter(answer => answer.isMarkedForReview).length;
    
    // Calculate accuracy
    const totalAnswered = this.analytics.correctAnswers + this.analytics.wrongAnswers;
    this.analytics.accuracy = totalAnswered > 0 ? (this.analytics.correctAnswers / totalAnswered) * 100 : 0;
    
    // Calculate average time per question
    const totalTime = this.answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
    this.analytics.averageTimePerQuestion = this.answers.length > 0 ? totalTime / this.answers.length : 0;
    
    // Find fastest and slowest answers
    const timeSpentArray = this.answers.map(answer => answer.timeSpent || 0).filter(time => time > 0);
    if (timeSpentArray.length > 0) {
      this.analytics.fastestAnswer = Math.min(...timeSpentArray);
      this.analytics.slowestAnswer = Math.max(...timeSpentArray);
    }
  }
  
  // Calculate percentage
  if (this.totalMarks > 0) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
  }
  
  // Determine if passed
  this.isPassed = this.obtainedMarks >= this.passingMarks;
  
  // Calculate grade based on percentage
  if (this.percentage >= 97) this.grade = 'A+';
  else if (this.percentage >= 93) this.grade = 'A';
  else if (this.percentage >= 90) this.grade = 'B+';
  else if (this.percentage >= 87) this.grade = 'B';
  else if (this.percentage >= 83) this.grade = 'C+';
  else if (this.percentage >= 80) this.grade = 'C';
  else if (this.percentage >= 70) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

// Static method to get exam results
resultSchema.statics.getExamResults = function(examId) {
  return this.find({ exam: examId })
    .populate('student', 'firstName lastName email')
    .sort({ obtainedMarks: -1 });
};

// Static method to get student results
resultSchema.statics.getStudentResults = function(studentId) {
  return this.find({ student: studentId })
    .populate('exam', 'title subject totalMarks')
    .sort({ createdAt: -1 });
};

// Static method to get top performers
resultSchema.statics.getTopPerformers = function(examId, limit = 10) {
  return this.find({ exam: examId, status: 'completed' })
    .populate('student', 'firstName lastName email')
    .sort({ obtainedMarks: -1 })
    .limit(limit);
};

// Static method to calculate exam statistics
resultSchema.statics.getExamStatistics = function(examId) {
  return this.aggregate([
    { $match: { exam: mongoose.Types.ObjectId(examId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$obtainedMarks' },
        averagePercentage: { $avg: '$percentage' },
        passRate: {
          $avg: {
            $cond: [{ $gte: ['$obtainedMarks', '$passingMarks'] }, 1, 0]
          }
        },
        averageTime: { $avg: '$timeSpent' },
        gradeDistribution: {
          $push: '$grade'
        }
      }
    }
  ]);
};

// Instance method to submit result
resultSchema.methods.submitResult = function() {
  this.status = 'submitted';
  this.endTime = new Date();
  this.timeSpent = Math.round((this.endTime - this.startTime) / 1000 / 60); // in minutes
  return this.save();
};

// Instance method to auto-submit result
resultSchema.methods.autoSubmitResult = function() {
  this.status = 'auto-submitted';
  this.endTime = new Date();
  this.timeSpent = Math.round((this.endTime - this.startTime) / 1000 / 60); // in minutes
  return this.save();
};

module.exports = mongoose.model('Result', resultSchema);
