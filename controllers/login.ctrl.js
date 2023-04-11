const router = require("express");
const mysql = require("mysql2");
const User = require("../models/users");
const bcrypt = require("bcrypt");

const emailExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i; //email regExp
const passwordExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,18}$/; //password regExp
const spaceExp = /\s/g; //space regExp

const loginUser = async(req, res) => {
    
    const {email, password} = req.body;
   
    if(email.match(emailExp) === null || email.match(spaceExp) !== null){
        return res.send("<script>alert('지정된 이메일 형식을 사용하세요. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/login';</script>");
    };

    if(password.match(passwordExp) === null || password.match(spaceExp) !== null){
        return res.send("<script>alert('비밀번호 형식은 숫자, 문자, 특수문자 포함 형태의 8~18자리 값만 허용됩니다. 또한 공백, 띄어쓰기는 허용하지 않습니다.');location.href='/login';</script>");
    };

    try{
        
        const exUser = await User.findOne({where: {email: email}});
        const pass = await bcrypt.compare(password, exUser.password);

        if(pass) {
            if(exUser !== null){
                req.session.email = email;
                req.session.is_logined = true;
                req.session.save(function() {
                });
                console.log("testtest")
                console.log(email)
                console.log(password)
                return res.send("<script>alert('로그인에 성공했습니다.');location.href='/';</script>");
            }else{
                return res.send("<script>alert('로그인에 실패했습니다.');location.href='/login';</script>");
            }
        } else {
            return res.send("<script>alert('로그인에 실패했습니다.');location.href='/login';</script>");
        }
    }catch(err){
        console.log(err);
        res.send("<script>alert('로그인에 실패했습니다.');location.href='/login';</script>");
    }

}

module.exports = {
    loginUser,
}


