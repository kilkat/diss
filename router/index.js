const { Router } = require("express");
const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.render("index.ejs");
})

router.get("/login", (req, res) => {
    res.render("login.ejs");
})

router.get("/register", (req, res) => {
    res.render("register.ejs");
})

router.post("/site-scaning", controller.site-scaning);


module.exports = router;