const { Router } = require("express");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const User = require("../models/users");
const emailExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i; //email regExp
const passwordExp =  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{1,100}$/; //password regExp
const alphabetExp = /^[a-zA-Z]*$/; //alphabet regExp
const spaceExp = /\s/g; //space regExp
    const createUser = async(req, res) => {
        const {email, name, password, re_password} = req.body;

        if(email.match(emailExp) === null || email.match(spaceExp) !== null || email.length > 40){
            return res.send("<script>alert('지정된 이메일 형식을 사용하세요. 1~40자리 값만 허용합니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/register';</script>");
        };

        if(name.match(alphabetExp) === null || name.match(spaceExp) !== null || name.length > 40){
            return res.send("<script>alert('이름은 1~40자리 알파벳만 허용합니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/register';</script>");
        };

        if(password.match(passwordExp) === null || re_password.match(passwordExp) === null || password.match(spaceExp) !== null || re_password.match(spaceExp) !== null){
            return res.send("<script>alert('비밀번호 형식은 숫자, 문자, 특수문자 포함 형태의 1~100자리 값만 허용됩니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/register';</script>");
        };

        if(password !== re_password || email.match(spaceExp) !== null){
            return res.send("<script>alert('비밀번호가 일치하지 않습니다.');location.href='/register';</script>");
        };

        try{
            const exUser = await User.findOne({ where: {email: email}});
            if (exUser !== null) {
                return res.send("<script>alert('중복된 이메일이 있습니다.');location.href='/register';</script>");
            }

            if(exUser === null ){
                bcrypt.hash(password, 10, (err, password) => {
                User.create({
                    email: email,
                    name: name,
                    password: password,
                });
                })
                return res.send("<script>alert('회원가입 되었습니다.');location.href='/';</script>");
            }else{
                return res.send("<script>alert('중복된 정보가 있습니다.');location.href='/register';</script>");
            }
            }catch(err){
                return res.send("<script>alert('오류가 발생했습니다.');location.href='/register';</script>");
            }
        }

module.exports = {
    createUser,
};