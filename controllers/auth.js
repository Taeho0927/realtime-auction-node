const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/user');

exports.join = async (req, res, next)=>{
    const { email, nick, password, money } = req.body;
    try{
        const exUser = await User.findOne({ where : {email} });
        if (exUser) {
            return res.redirect('/join?error=이미 가입된 이메일입니다');
        }
        const hash = await bcrypt.hash(password, 12); // 해싱 라운드 12번 적용
        await User.create({
            email,
            nick,
            password: hash,
            money,
        });
        return res.redirect('/');
    } catch(error){
        console.error(error);
        return next(error);   
    }
}

exports.login = (req, res, next)=>{
    passport.authenticate('local',(authError, user, info)=>{
        if (authError){
            console.error(authError);
            return next(authError);
        }
        if (!user){
            return res.redirect(`/?loginError=${info.message}`);
        }
        return req.login(user, (loginError)=>{
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next); // 미들웨어 내의 미들웨어레는 (req, res, next)를 붙여야함
};

exports.logout = (req, res) =>{
    req.logout(()=>{
        res.redirect('/');
    });
};