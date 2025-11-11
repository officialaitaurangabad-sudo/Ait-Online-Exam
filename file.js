const fs = require('fs');
const path = require('path');

function saveUserFile(username, filename, data) {
  const userDir = path.join(__dirname, 'uploads', username);
  const filePath = path.join(userDir, filename);

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  fs.writeFileSync(filePath, data);
  console.log(`File saved at: ${filePath}`);
}

saveUserFile('john_doe', 'profile.txt', 'Hello John!');
