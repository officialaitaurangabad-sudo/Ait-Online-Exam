const mongoose = require('mongoose');
const Result = require('../models/resultModel');
const Question = require('../models/questionModel');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-exam-platform');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix answer validation for existing results
const fixAnswerValidation = async () => {
  try {
    console.log('Starting to fix answer validation...');
    
    // Get all results that need fixing
    const results = await Result.find({ 
      status: { $in: ['completed', 'submitted', 'auto-submitted'] }
    }).populate('answers.question');
    
    console.log(`Found ${results.length} results to process`);
    
    let fixedCount = 0;
    
    for (const result of results) {
      let needsUpdate = false;
      
      for (const answer of result.answers) {
        if (answer.question && answer.question.questionType === 'multiple-choice') {
          const question = answer.question;
          const correctOption = question.options.find(option => option.isCorrect);
          
          if (correctOption) {
            let isCorrect = false;
            
            // Check if selectedAnswer is an ID or text
            if (answer.selectedAnswer && answer.selectedAnswer.match(/^[0-9a-fA-F]{24}$/)) {
              // selectedAnswer is an ID, find the corresponding option
              const selectedOption = question.options.find(option => 
                option._id.toString() === answer.selectedAnswer || option.id === answer.selectedAnswer
              );
              isCorrect = selectedOption && selectedOption.isCorrect;
            } else {
              // selectedAnswer is text, compare directly
              isCorrect = answer.selectedAnswer === correctOption.text;
            }
            
            // Update if the validation result is different
            if (answer.isCorrect !== isCorrect) {
              console.log(`Fixing answer for result ${result._id}, question ${answer.question._id}:`);
              console.log(`  Old isCorrect: ${answer.isCorrect}, New isCorrect: ${isCorrect}`);
              console.log(`  SelectedAnswer: ${answer.selectedAnswer}`);
              console.log(`  CorrectOption: ${correctOption.text}`);
              
              answer.isCorrect = isCorrect;
              answer.marksObtained = isCorrect ? question.marks : (question.negativeMarks > 0 ? -question.negativeMarks : 0);
              needsUpdate = true;
            }
          }
        }
      }
      
      if (needsUpdate) {
        // Recalculate total marks
        result.obtainedMarks = result.answers.reduce((sum, ans) => sum + ans.marksObtained, 0);
        
        // Recalculate percentage
        if (result.totalMarks > 0) {
          result.percentage = (result.obtainedMarks / result.totalMarks) * 100;
        }
        
        // Determine if passed
        result.isPassed = result.obtainedMarks >= result.passingMarks;
        
        // Calculate grade based on percentage
        if (result.percentage >= 97) result.grade = 'A+';
        else if (result.percentage >= 93) result.grade = 'A';
        else if (result.percentage >= 90) result.grade = 'B+';
        else if (result.percentage >= 87) result.grade = 'B';
        else if (result.percentage >= 83) result.grade = 'C+';
        else if (result.percentage >= 80) result.grade = 'C';
        else if (result.percentage >= 70) result.grade = 'D';
        else result.grade = 'F';
        
        await result.save();
        fixedCount++;
        console.log(`Fixed result ${result._id}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} results out of ${results.length} total results`);
    
  } catch (error) {
    console.error('Error fixing answer validation:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixAnswerValidation();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixAnswerValidation };
