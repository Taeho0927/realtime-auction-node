const passport = require('passport');

const local = require('./localStrategy');
const User = require('../models/user');


/**
 * 세션은 유저 브라우저 쿠키에 설립되고 유지됨
 * serializeUser와 deserializeUser 메서드를 통해 세션을 관리한다.
 */
module.exports = () =>{
    passport.serializeUser((user, done)=>{  // serializeUser는 로그인 요청에서만 호출된다
        done(null, user.id) // req.session에 사용자 id만 저장
    });

    passport.deserializeUser((id, done)=>{ // req.session에 저장된 id값을 이용해서 DB에서 사용자 정보를 조회해온다.
        User.findOne({where:{id} }) // id 값으로 데이터베이스에서 전체 유저 정보를 찾아오는 과정
            .then(user => done(null, user)) // req.user에 조회한 결과가 담김
            .catch(err => done(err));
    });
    local();
};