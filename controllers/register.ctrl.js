const { Router } = require("express");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const user = require("../models/users");
const emailExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i; //email regExp
const passwordExp =  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{1,100}$/; //password regExp
const alphabetExp = /^[a-zA-Z]*$/; //alphabet regExp
const spaceExp = /\s/g; //space regExp
    const createUser = async(req, res) => {

        const {email, name, password, re_password} = req.body;

        if(email.match(emailExp) === null || email.match(spaceExp) !== null || email.length > 40){
            return res.status(401).send({
                ok: false,
                message: 'INVALID_EMAIL',
              });
        };

        if(name.match(alphabetExp) === null || name.match(spaceExp) !== null || name.length > 40){
            return res.status(401).send({
                ok: false,
                message: 'INVALID_NAME',
              });
        };

        if(password.match(passwordExp) === null || re_password.match(passwordExp) === null || password.match(spaceExp) !== null || re_password.match(spaceExp) !== null){
            return res.status(401).send({
                ok: false,
                message: 'INVALID_PASSWORD',
              });
        };

        if(password !== re_password || email.match(spaceExp) !== null){
            return res.status(401).send({
                ok: false,
                message: 'INVALID_REPASSWORD',
              });
        };

        try{
            const exUser = await user.findOne({ where: {email: email}}); //user 중복 검사
            if (exUser !== null) {
                return res.status(401).send({
                    ok: false,
                    message: 'INVALID_USER',
                  });
            }

            if(exUser === null ){
                bcrypt.hash(password, 10, (err, password) => {
                user.create({
                    email: email,
                    name: name,
                    password: password,
                });
                })
                return res.status(200).send({
                    ok: true,
                    message: 'REGISTER_SUCCESS',
                  });
            }else{
                return res.status(401).send({
                    ok: false,
                    message: 'INVALID_USER',
                  });
            }
            }catch(err){
                return res.status(500).send({
                    ok: false,
                    message: 'DB_ERROR',
                  });
            }
        }

module.exports = {
    createUser,
};