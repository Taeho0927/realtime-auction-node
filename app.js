const express = require('express'); // nodejs 용 웹 프레임워크
const path = require('path'); // path 모듈은 파일과 Directory 경로 작업을 위해
const morgan = require('morgan'); // 포트 접속시 콘솔에 로그을 남길 수 있음
const cookieParser = require('cookie-parser'); // cookie-parser는 요청과 함께 들어온 쿠키를 해석해서 req.cookie 객체로 만듬
const session = require('express-session');  
const passport = require('passport'); // 로그인과 같이 사용자 인증을 위해 사용됨 , session을 기반으로함.. 사용자 정보를 세션에 저장하고 쿠키를 통해서 식별함
const nunjucks = require('nunjucks'); // 자바스크립트에서 사용할 수 있는 템플릿 엔진 중 하나
const dotenv = require('dotenv'); // .env 파일로 중요 정보를 노출시키지 않기 위함 (당연히 .gitignore에 들어가야함) 

dotenv.config();
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models');
const passportConfig = require('./passport')
const sse = require('./sse');
const webSocket = require('./socket');

const app = express();
passportConfig();
app.set('port', process.env.PORT || 8010);
app.set('view engine', 'html');
nunjucks.configure('views',{
    express: app,
    watch: true,
});
sequelize.sync({force : false}) // 강제 업데이트 : false
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    });

const sessionMiddleware = session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
});

app.use(morgan('dev'));
app.use('/img',express.static(path.join(__dirname, 'uploads'))); // 파일 경로가 있는 이 경로에 대한 모든 요청은 'uploads' 디렉토리에서 해당 파일로 제공하게됨
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize()); // passport를 초기화 하기 위해서 passport.initialize 미들웨어를 사용함
app.use(passport.session()); // session 사용을 위해서 passport.session 미들웨어를 사용함

app.use('/', indexRouter);
app.use('/auth', authRouter);

app.use((req, res, next)=>{
    const error = new Error(`${req.method},${req.url} 라우터는 없습니다.`);
    error.status(404);
    next(error);
});

app.use((err, req, res, next)=>{
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production'? err :{};
    res.status(err.status || 500);
    res.render('error'); 
});

const server = app.listen(app.get('port'), ()=>{
    console.log(app.get('port'),'번에서 대기중');
});

webSocket(server, app);
sse(server);