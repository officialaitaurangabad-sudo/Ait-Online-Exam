const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  result: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    difficulty: {
      type: Number,
      min: [1, 'Difficulty rating must be at least 1'],
      max: [5, 'Difficulty rating cannot exceed 5']
    },
    clarity: {
      type: Number,
      min: [1, 'Clarity rating must be at least 1'],
      max: [5, 'Clarity rating cannot exceed 5']
    },
    timeAllocation: {
      type: Number,
      min: [1, 'Time allocation rating must be at least 1'],
      max: [5, 'Time allocation rating cannot exceed 5']
    },
    questionQuality: {
      type: Number,
      min: [1, 'Question quality rating must be at least 1'],
      max: [5, 'Question quality rating cannot exceed 5']
    }
  },
  feedback: {
    positive: {
      type: String,
      trim: true,
      maxlength: [1000, 'Positive feedback cannot exceed 1000 characters']
    },
    negative: {
      type: String,
      trim: true,
      maxlength: [1000, 'Negative feedback cannot exceed 1000 characters']
    },
    suggestions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Suggestions cannot exceed 1000 characters']
    },
    technicalIssues: {
      type: String,
      trim: true,
      maxlength: [1000, 'Technical issues description cannot exceed 1000 characters']
    }
  },
  categories: {
    examContent: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor', 'very-poor']
    },
    userExperience: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor', 'very-poor']
    },
    technicalPerformance: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor', 'very-poor']
    },
    timeManagement: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor', 'very-poor']
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
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
  reviewComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review comments cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  response: {
    type: String,
    trim: true,
    maxlength: [1000, 'Response cannot exceed 1000 characters']
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average rating
feedbackSchema.virtual('averageRating').get(function() {
  const ratings = [
    this.rating.overall,
    this.rating.difficulty,
    this.rating.clarity,
    this.rating.timeAllocation,
    this.rating.questionQuality
  ].filter(rating => rating !== undefined);
  
  return ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
});

// Virtual for feedback sentiment
feedbackSchema.virtual('sentiment').get(function() {
  const avgRating = this.averageRating;
  if (avgRating >= 4) return 'positive';
  if (avgRating >= 3) return 'neutral';
  return 'negative';
});

// Indexes for better performance
feedbackSchema.index({ exam: 1 });
feedbackSchema.index({ student: 1 });
feedbackSchema.index({ result: 1 });
feedbackSchema.index({ 'rating.overall': 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ isPublic: 1 });

// Pre-save middleware to set priority based on rating
feedbackSchema.pre('save', function(next) {
  const avgRating = this.averageRating;
  
  if (avgRating <= 2) {
    this.priority = 'high';
  } else if (avgRating <= 3) {
    this.priority = 'medium';
  } else {
    this.priority = 'low';
  }
  
  // Check for urgent keywords in feedback
  const urgentKeywords = ['bug', 'error', 'crash', 'broken', 'not working', 'urgent'];
  const feedbackText = [
    this.feedback.positive,
    this.feedback.negative,
    this.feedback.suggestions,
    this.feedback.technicalIssues
  ].join(' ').toLowerCase();
  
  if (urgentKeywords.some(keyword => feedbackText.includes(keyword))) {
    this.priority = 'urgent';
  }
  
  next();
});

// Static method to get exam feedback
feedbackSchema.statics.getExamFeedback = function(examId) {
  return this.find({ exam: examId })
    .populate('student', 'firstName lastName email')
    .populate('result', 'obtainedMarks percentage')
    .sort({ createdAt: -1 });
};

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStatistics = function(examId) {
  return this.aggregate([
    { $match: { exam: mongoose.Types.ObjectId(examId) } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating.overall' },
        averageDifficulty: { $avg: '$rating.difficulty' },
        averageClarity: { $avg: '$rating.clarity' },
        averageTimeAllocation: { $avg: '$rating.timeAllocation' },
        averageQuestionQuality: { $avg: '$rating.questionQuality' },
        ratingDistribution: {
          $push: '$rating.overall'
        },
        priorityDistribution: {
          $push: '$priority'
        },
        statusDistribution: {
          $push: '$status'
        }
      }
    }
  ]);
};

// Static method to get recent feedback
feedbackSchema.statics.getRecentFeedback = function(limit = 10) {
  return this.find({ isPublic: true })
    .populate('exam', 'title subject')
    .populate('student', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get feedback by priority
feedbackSchema.statics.getFeedbackByPriority = function(priority) {
  return this.find({ priority, status: { $ne: 'resolved' } })
    .populate('exam', 'title subject')
    .populate('student', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Instance method to mark as reviewed
feedbackSchema.methods.markAsReviewed = function(reviewerId, comments) {
  this.isReviewed = true;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewComments = comments;
  return this.save();
};

// Instance method to respond to feedback
feedbackSchema.methods.respondToFeedback = function(responderId, response) {
  this.response = response;
  this.respondedBy = responderId;
  this.respondedAt = new Date();
  this.status = 'resolved';
  return this.save();
};

// Instance method to update status
feedbackSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

module.exports = mongoose.model('Feedback', feedbackSchema);
