const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [2000, 'Question text cannot exceed 2000 characters']
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-in-blank', 'essay', 'matching', 'ordering'],
    required: [true, 'Question type is required']
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Option text cannot exceed 500 characters']
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters']
    }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, or object depending on question type
    required: [true, 'Correct answer is required']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [2000, 'Explanation cannot exceed 2000 characters']
  },
  marks: {
    type: Number,
    required: [true, 'Marks is required'],
    min: [0.5, 'Marks must be at least 0.5'],
    max: [100, 'Marks cannot exceed 100']
  },
  negativeMarks: {
    type: Number,
    default: 0,
    min: [0, 'Negative marks cannot be negative']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  subtopic: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  media: {
    images: [{
      publicId: String,
      url: String,
      alt: String
    }],
    videos: [{
      publicId: String,
      url: String,
      title: String
    }],
    audio: [{
      publicId: String,
      url: String,
      title: String
    }],
    documents: [{
      publicId: String,
      url: String,
      title: String,
      type: String
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageTime: {
    type: Number, // in seconds
    default: 0
  },
  successRate: {
    type: Number, // percentage
    default: 0
  },
  language: {
    type: String,
    default: 'en'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    questionText: String,
    options: [{
      text: String,
      isCorrect: Boolean,
      explanation: String
    }],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    marks: Number,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for question complexity score
questionSchema.virtual('complexityScore').get(function() {
  let score = 0;
  
  // Base score by difficulty
  switch (this.difficulty) {
    case 'easy': score += 1; break;
    case 'medium': score += 2; break;
    case 'hard': score += 3; break;
  }
  
  // Add score for media content
  if (this.media && this.media.images && this.media.images.length > 0) score += 0.5;
  if (this.media && this.media.videos && this.media.videos.length > 0) score += 1;
  if (this.media && this.media.audio && this.media.audio.length > 0) score += 0.5;
  if (this.media && this.media.documents && this.media.documents.length > 0) score += 0.5;
  
  // Add score for question length
  if (this.questionText && this.questionText.length > 500) score += 0.5;
  if (this.questionText && this.questionText.length > 1000) score += 0.5;
  
  return score;
});

// Indexes for better performance
questionSchema.index({ createdBy: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1, isPublic: 1 });

// Pre-save middleware to validate question data
questionSchema.pre('save', function(next) {
  // Validate options for multiple choice questions
  if (this.questionType === 'multiple-choice' && this.options.length < 2) {
    next(new Error('Multiple choice questions must have at least 2 options'));
  }
  
  // Validate that at least one option is correct for multiple choice
  if (this.questionType === 'multiple-choice') {
    const hasCorrectOption = this.options.some(option => option.isCorrect);
    if (!hasCorrectOption) {
      next(new Error('At least one option must be marked as correct'));
    }
  }
  
  // Validate true/false questions
  if (this.questionType === 'true-false' && this.options.length !== 2) {
    next(new Error('True/False questions must have exactly 2 options'));
  }
  
  // Validate negative marks don't exceed positive marks
  if (this.negativeMarks > this.marks) {
    next(new Error('Negative marks cannot exceed positive marks'));
  }
  
  next();
});

// Static method to find questions by subject
questionSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: new RegExp(subject, 'i'), isActive: true });
};

// Static method to find questions by difficulty
questionSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, isActive: true });
};

// Static method to find random questions
questionSchema.statics.findRandom = function(criteria, limit = 10) {
  return this.aggregate([
    { $match: { ...criteria, isActive: true } },
    { $sample: { size: limit } }
  ]);
};

// Static method to get question statistics
questionSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        averageMarks: { $avg: '$marks' },
        averageSuccessRate: { $avg: '$successRate' },
        byDifficulty: {
          $push: {
            difficulty: '$difficulty',
            marks: '$marks'
          }
        },
        bySubject: {
          $push: {
            subject: '$subject',
            marks: '$marks'
          }
        }
      }
    }
  ]);
};

// Instance method to update usage statistics
questionSchema.methods.updateUsageStats = function(timeSpent, isCorrect) {
  this.usageCount += 1;
  
  // Update average time
  const totalTime = this.averageTime * (this.usageCount - 1) + timeSpent;
  this.averageTime = totalTime / this.usageCount;
  
  // Update success rate
  const correctAnswers = this.successRate * (this.usageCount - 1) + (isCorrect ? 1 : 0);
  this.successRate = (correctAnswers / this.usageCount) * 100;
  
  return this.save();
};

// Instance method to create a new version
questionSchema.methods.createNewVersion = function(updatedData) {
  // Save current version to previousVersions
  this.previousVersions.push({
    questionText: this.questionText,
    options: this.options,
    correctAnswer: this.correctAnswer,
    explanation: this.explanation,
    marks: this.marks
  });
  
  // Update current data
  Object.assign(this, updatedData);
  this.version += 1;
  
  return this.save();
};

module.exports = mongoose.model('Question', questionSchema);
