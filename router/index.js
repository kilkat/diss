const { Router } = require("express");
const express = require("express");

const router = express.Router();

const attack_controller = require('../controller/attack')

router.get("/", (req, res) => {
    res.render("index.ejs");
})

router.get("/login", (req, res) => {
    res.render("login.ejs");
})

router.get("/register", (req, res) => {
    res.render("register.ejs");
})

router.get("/reflected-xss-success", attack_controller.reflected_xss_success); //url에 세션 아이디 넘겨줘야됨

router.post("/site-scaning", controller.site-scaning);


module.exports = router;