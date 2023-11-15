const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // 쿠키 파서 미들웨어를 추가합니다.

const router = express.Router();

const scanningController = require('../controllers/scan.ctrl');
const loginController = require("../controllers/login.ctrl");
const registerController = require("../controllers/register.ctrl");
const resultController = require("../controllers/result.ctrl");

// 쿠키 파서를 사용하도록 설정합니다.
router.use(cookieParser());

router.post("/login", loginController.loginUser);

router.post("/register", registerController.createUser);

// authenticateUser 미들웨어를 사용하여 /scan_injection 라우트를 보호합니다.
router.post("/scan_injection", authenticateUser, scanningController.xss_scan);

router.get("/scan_reflcted_injection_success");

router.get("/scan_stored_injection_success", scanningController.stored_xss_scan_success);

router.post("/scan_traversal", authenticateUser, scanningController.pathtraversal_scan);

router.post("/scan_command", authenticateUser, scanningController.os_command_injection);

router.get("/lists", authenticateUser, resultController.scanResultList)

router.get("/lists/:scanId", authenticateUser, resultController.scanResult);

router.get("/result_data/:scanId", authenticateUser, resultController.scanResultPage);

router.post("/scan_cancel", authenticateUser,  scanningController.scan_cancel);

router.post("/scan_sqlinjection", authenticateUser, scanningController.sql_injection_scan);

function authenticateUser(req, res, next) {
    let token = req.headers.authorization;
    token = token.split(' ')[1]
    console.log("Received Token: ", token);
    
    if (!token) {
        return res.status(401).json({ message: 'TOKEN_NOT_FOUND' });
    }

    const secretKey = process.env.COOKIE_SECRET;
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.error("Token verification error: ", err);
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.log("Decoded Token: ", decoded);
        req.email = decoded.email;
        next();
    });
}

router.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, '/../build/index.html'));
});

module.exports = router;
