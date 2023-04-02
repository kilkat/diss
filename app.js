const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const cors = require('cors');


const { sequelize } = require("./models");

dotenv.config();
const app = express();
app.set("port", process.env.PORT | 80);

//Router
const router = require("./router");

app.set("view engine", "ejs");

app.use(express.json());

app.use(cors());

app.use(express.static(path.join(__dirname, '/build')))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'))
})

sequelize.sync({ force: false })
    .then(() => {
        console.log("데이터베이스 연결 성공");
    })
    .catch((err) => {
        console.error(err)
    });
    
app.use(morgan("dev"));
// app.use("/", express.static(path.join(__dirname, "public"))); //for static files(relative path)
app.use(express.json());
app.use(express.urlencoded({extended: false })); // for body-parser use
app.use(cookieParser(process.env.COOKIE_SECRET)); //get cookie : secret key

/****
app.use(session({

    resave: false,
    saveUnitialized: false,
    secret: process.env.COOCKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
    name: "session-cookie"

}));
****/


app.use("/", router);



app.use((req, res, next) => {
    res.status(404).send("Not Found");
})

app.listen(app.get("port"), () => {
    console.log(app.get("port"), "번 포트 실행중");
})