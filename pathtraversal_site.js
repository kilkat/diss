const express = require('express');
const fs = require('fs');
const app = express();

app.get('/download', (req, res) => {
  const fileName = req.query.file; // /download 경로에 query.file /download?file= 형식으로 받아오는중
  //입력값에 대한 검증이 없음 -> pathtraversal 취약점 발생
  const filePath = `${__dirname}/${fileName}`;
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
