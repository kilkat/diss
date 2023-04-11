const { Router } = require("express");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const User = require("../migrations/20230407172304KST-create-users");
const email_exp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i; //email regExp
const password_exp =  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{1,100}$/; //password regExp
const alphabet_exp = /^[a-zA-Z]*$/; //alphabet regExp
const space_exp = /\s/g; //space regExp
    const create_user = async(req, res) => {
        const {email, name, password, re_password} = req.body;
        console.log(email);
        console.log(name);
        console.log(password);
        console.log(re_password);

        // if(email.match(email_exp) === null || email.match(space_exp) !== null || email.length > 40){
        //     return res.send("<script>alert('지정된 이메일 형식을 사용하세요. 1~40자리 값만 허용합니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/register';</script>");
        // };

        // if(name.match(alphabet_exp) === null || name.match(space_exp) !== null || name.length > 40){
        //     return res.send("<script>alert('이름은 1~40자리 알파벳만 허용합니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/register';</script>");
        // };

        // if(password.match(password_exp) === null || re_password.match(password_exp) === null || password.match(space_exp) !== null || re_password.match(space_exp) !== null){
        //     return res.send("<script>alert('비밀번호 형식은 숫자, 문자, 특수문자 포함 형태의 1~100자리 값만 허용됩니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/register';</script>");
        // };

        // if(password !== re_password || email.match(space_exp) !== null){
        //     return res.send("<script>alert('비밀번호가 일치하지 않습니다.');location.href='/register';</script>");
        // };

        try{
            console.log("exUser 진입 전");
            const exUser = await User.findOne({ where: {email: email}});
            console.log("test");
            if (exUser !== null) {
                return res.send("<script>alert('중복된 이메일이 있습니다.');location.href='/register';</script>");
            }
            console.log("exUser 진입 후");

            if(exUser === null ){
                console.log("create 진입 전");
                bcrypt.hash(password, 10, (err, password) => {
                User.create({
                    email: email,
                    name: name,
                    password: password,
                });
                })
                console.log("create 진입 후")
                return res.send("<script>alert('회원가입 되었습니다.');location.href='/';</script>");
            }else{
                return res.send("<script>alert('중복된 정보가 있습니다.');location.href='/register';</script>");
            }
            }catch(err){
                return res.send("<script>alert('오류가 발생했습니다.');location.href='/register';</script>");
            }
        }

module.exports = {
    create_user,
};