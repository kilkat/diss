const express = require('express');
const fs = require('fs');

const app = express();

app.get('/download/:file', (req, res) => {
  const fileName = req.params.file;
  const filePath = `${__dirname}/uploads/${fileName}`;
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(500).send('Error');
    } else {
      res.download(filePath);
    }
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
