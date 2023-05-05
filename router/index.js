const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const router = express.Router();

const scanningController = require('../controllers/scan.ctrl');

const loginController = require("../controllers/login.ctrl");
const registerController = require("../controllers/register.ctrl");

router.get("*", function (req,res) {
    res.sendFile(path.join(__dirname, '/../build/index.html'))
})

router.get("/", (req, res) => {
    res.render("index.ejs", {session: req.session});
})

router.get("/login", (req, res) => {
    res.render("login.ejs");
})
router.post("/login", loginController.loginUser);

router.get("/register", (req, res) => {
    res.render("register.ejs");
})
router.post("/register", registerController.createUser);

router.post("/scan_injection", scanningController.xss_scan);

router.get("/scan_injection", scanningController.xss_scan_result)

router.post("/scan_traversal", scanningController.pathtraversal_scan);

router.get("/result", scanningController.result);

// router.get("/reflected-xss-success", scanningController.scanning); //url에 세션 아이디 넘겨줘야됨

router.get('/protected', (req, res) => {
    // 헤더에서 토큰을 가져옴
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
  
    const token = authHeader.split(' ')[1];
  
    // 토큰 검증
    jwt.verify(token, 'my_secret_key', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      // 요청한 사용자 ID를 가져와서 사용자 데이터를 찾음
      const userNumber = decoded.userNumber;
      const user = users.find(u => u.number === userNumber);
  
      res.send({ message: `Hello, ${user.name}!` });
    });
  });

// router.post("/site-scaning", controller.site-scaning);


module.exports = router;