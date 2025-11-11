const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        logger.info(`CSV parsed successfully: ${results.length} rows`);
        resolve(results);
      })
      .on('error', (error) => {
        logger.error('CSV parsing error:', error);
        reject(error);
      });
  });
};

// Parse Excel file
const parseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    logger.info(`Excel parsed successfully: ${data.length} rows`);
    return data;
  } catch (error) {
    logger.error('Excel parsing error:', error);
    throw error;
  }
};

// Parse JSON file
const parseJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    logger.info(`JSON parsed successfully: ${Array.isArray(parsed) ? parsed.length : 1} items`);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    logger.error('JSON parsing error:', error);
    throw error;
  }
};

// Validate question data
const validateQuestionData = (data) => {
  const errors = [];
  
  // Required fields
  const requiredFields = ['questionText', 'questionType', 'marks', 'difficulty', 'subject'];
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate question type
  const validQuestionTypes = ['multiple-choice', 'true-false', 'fill-in-blank', 'essay', 'matching', 'ordering'];
  if (data.questionType && !validQuestionTypes.includes(data.questionType)) {
    errors.push(`Invalid question type: ${data.questionType}`);
  }
  
  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (data.difficulty && !validDifficulties.includes(data.difficulty)) {
    errors.push(`Invalid difficulty: ${data.difficulty}`);
  }
  
  // Validate marks
  if (data.marks && (isNaN(data.marks) || data.marks <= 0)) {
    errors.push('Marks must be a positive number');
  }
  
  // Validate options for multiple choice questions
  if (data.questionType === 'multiple-choice') {
    if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
      errors.push('Multiple choice questions must have at least 2 options');
    } else {
      const hasCorrectOption = data.options.some(option => 
        option.isCorrect === true || option.isCorrect === 'true'
      );
      if (!hasCorrectOption) {
        errors.push('At least one option must be marked as correct');
      }
    }
  }
  
  return errors;
};

// Parse options from string
const parseOptions = (optionsString) => {
  if (!optionsString) return [];
  
  try {
    // Try to parse as JSON first
    if (optionsString.startsWith('[') || optionsString.startsWith('{')) {
      return JSON.parse(optionsString);
    }
    
    // Parse as pipe-separated values
    const options = optionsString.split('|').map(option => {
      const parts = option.split(':');
      return {
        text: parts[0].trim(),
        isCorrect: parts[1] ? parts[1].trim().toLowerCase() === 'true' : false,
        explanation: parts[2] ? parts[2].trim() : ''
      };
    });
    
    return options;
  } catch (error) {
    logger.error('Error parsing options:', error);
    return [];
  }
};

// Parse tags from string
const parseTags = (tagsString) => {
  if (!tagsString) return [];
  
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

// Convert parsed data to question format
const convertToQuestionFormat = (data) => {
  const question = {
    questionText: data.questionText?.toString().trim(),
    questionType: data.questionType?.toString().trim(),
    marks: parseFloat(data.marks) || 1,
    difficulty: data.difficulty?.toString().trim(),
    subject: data.subject?.toString().trim(),
    topic: data.topic?.toString().trim(),
    subtopic: data.subtopic?.toString().trim(),
    explanation: data.explanation?.toString().trim(),
    negativeMarks: parseFloat(data.negativeMarks) || 0,
    language: data.language?.toString().trim() || 'en'
  };
  
  // Parse options
  if (data.options) {
    question.options = parseOptions(data.options);
  }
  
  // Parse correct answer
  if (data.correctAnswer) {
    try {
      question.correctAnswer = JSON.parse(data.correctAnswer);
    } catch (error) {
      question.correctAnswer = data.correctAnswer.toString().trim();
    }
  }
  
  // Parse tags
  if (data.tags) {
    question.tags = parseTags(data.tags);
  }
  
  return question;
};

// Process bulk questions data
const processBulkQuestions = async (filePath, fileType) => {
  try {
    let rawData;
    
    // Parse file based on type
    switch (fileType) {
      case 'csv':
        rawData = await parseCSV(filePath);
        break;
      case 'xlsx':
      case 'xls':
        rawData = parseExcel(filePath);
        break;
      case 'json':
        rawData = parseJSON(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    const processedQuestions = [];
    const errors = [];
    
    rawData.forEach((row, index) => {
      try {
        const question = convertToQuestionFormat(row);
        const validationErrors = validateQuestionData(question);
        
        if (validationErrors.length > 0) {
          errors.push({
            row: index + 1,
            errors: validationErrors
          });
        } else {
          processedQuestions.push(question);
        }
      } catch (error) {
        errors.push({
          row: index + 1,
          errors: [`Processing error: ${error.message}`]
        });
      }
    });
    
    return {
      questions: processedQuestions,
      errors,
      totalRows: rawData.length,
      validQuestions: processedQuestions.length,
      invalidQuestions: errors.length
    };
  } catch (error) {
    logger.error('Error processing bulk questions:', error);
    throw error;
  }
};

// Export questions to CSV
const exportQuestionsToCSV = (questions) => {
  const headers = [
    'questionText',
    'questionType',
    'options',
    'correctAnswer',
    'explanation',
    'marks',
    'negativeMarks',
    'difficulty',
    'subject',
    'topic',
    'subtopic',
    'tags',
    'language'
  ];
  
  const csvData = questions.map(question => {
    const row = {};
    headers.forEach(header => {
      switch (header) {
        case 'options':
          row[header] = JSON.stringify(question.options || []);
          break;
        case 'correctAnswer':
          row[header] = JSON.stringify(question.correctAnswer);
          break;
        case 'tags':
          row[header] = (question.tags || []).join(',');
          break;
        default:
          row[header] = question[header] || '';
      }
    });
    return row;
  });
  
  return csvData;
};

// Export questions to Excel
const exportQuestionsToExcel = (questions, filePath) => {
  try {
    const csvData = exportQuestionsToCSV(questions);
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    XLSX.writeFile(workbook, filePath);
    
    logger.info(`Questions exported to Excel: ${filePath}`);
    return true;
  } catch (error) {
    logger.error('Error exporting to Excel:', error);
    throw error;
  }
};

// Get file type from extension
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.csv':
      return 'csv';
    case '.xlsx':
      return 'xlsx';
    case '.xls':
      return 'xls';
    case '.json':
      return 'json';
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
};

// Validate file size
const validateFileSize = (filePath, maxSize = 10 * 1024 * 1024) => { // 10MB default
  const stats = fs.statSync(filePath);
  if (stats.size > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }
  return true;
};

module.exports = {
  parseCSV,
  parseExcel,
  parseJSON,
  validateQuestionData,
  parseOptions,
  parseTags,
  convertToQuestionFormat,
  processBulkQuestions,
  exportQuestionsToCSV,
  exportQuestionsToExcel,
  getFileType,
  validateFileSize
};
