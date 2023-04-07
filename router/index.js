const { Router } = require("express");
const express = require("express");
const path = require("path");

const router = express.Router();

const attack_controller = require('../controllers/attack')

const login_controller = require("../controllers/login.ctrl");
const register_controller = require("../controllers/register.ctrl");

router.get("*", function (req,res) {
    res.sendFile(path.join(__dirname, '/diss/buid/index.html'))
})

router.get("/", (req, res) => {
    res.render("index.ejs");
})

router.get("/login", (req, res) => {
    res.render("login.ejs");
})
router.post("/login", login_controller.login_user);

router.get("/register", (req, res) => {
    res.render("register.ejs");
})
router.post("/register", register_controller.create_user);

router.get("/reflected-xss-success", attack_controller.reflected_xss_success); //url에 세션 아이디 넘겨줘야됨

// router.post("/site-scaning", controller.site-scaning);


module.exports = router;