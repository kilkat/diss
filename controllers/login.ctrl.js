const router = require("express");
const mysql = require("mysql2");
const user = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

const emailExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
const passwordExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,18}$/;
const spaceExp = /\s/g;

const loginUser = async(req, res, next) => {
    
    const {email, password} = req.body;
   
    if(email.match(emailExp) === null || email.match(spaceExp) !== null){
        return res.status(401).send({
            ok: false,
            message: 'INVALID_EMAIL',
          });
    };

    if(password.match(passwordExp) === null || password.match(spaceExp) !== null){
        return res.status(401).send({
            ok: false,
            message: 'INVALID_PASSWORD',
          });
    };

    try{
        
        const exUser = await user.findOne({where: {email: email}});

        console.log(exUser);

        if(!exUser) {
            console.log("login fail");
            return res.status(401).send({
                ok: false,
                message: 'INCOLLECT_EMAIL',
              });
        }

        const pass = await bcrypt.compare(password, exUser.password);

        console.log(pass);

        if(pass) {
            const key = process.env.COOKIE_SECRET;
            let token = '';
            token = jwt.sign(
                {
                  type: "JWT",
                  email: email,
                  name: exUser.name,
                },
                key,
                {
                  expiresIn: "15m",
                  issuer: "토큰발급자",
                }
              );
              console.log("Generated Token Payload: ", { email: email, name: exUser.name });
              console.log(token);

              res.cookie('token', token, {
                httpOnly: true,
                maxAge: 900000,  // 15분 (15m * 60s * 1000ms)
                secure: false,
                sameSite: 'Strict'
              });

              // response
              return res.status(200).send({
                ok: true,
                data: {
                  id: exUser.id,
                  token,
                  email: email,
                  name: exUser.name,
                },
              });
        }else{
            return res.status(401).send({
                ok: false,
                message: 'INCOLLECT_PASSWORD',
              });
        }
    }catch(err){
        console.log(err);
            return res.status(500).send({
                ok: false,
                message: 'DB_ERROR',
              });
    }

}

module.exports = {
    loginUser,
}


