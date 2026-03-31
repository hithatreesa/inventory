const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tmp/eslint_errors.json', 'utf16le'));
data.forEach(d => {
  d.messages.forEach(m => {
    if(m.severity === 2) {
      console.log(d.filePath + ' - Line ' + m.line + ': ' + m.message);
    }
  });
});
