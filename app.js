var express=require("express");
var app=express();
var router = require('./router');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser=require('cookie-parser');

// 注册模板引擎
app.engine('html', require('express-art-template'));

// 开放静态资源
app.use('/public/',express.static('./public/'));
app.use('/node_modules/', express.static('./node_modules/'));

// 使用 session 中间件
app.set('trust proxy',1);
app.use(session({
    secret :  'secret', // 对session id 相关的cookie 进行签名
    resave : true,
	name:"sessionid",
	// rolling:true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie : {
		// secure:true,
        maxAge : 1000 * 60 * 600 // 设置 session 的有效时间，单位毫秒,现在为1小时
    },
}));

// 配置解析表单 POST 请求体插件（注意：一定要在 app.use(router) 之前 ）
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// 挂载cookie解析
app.use(cookieParser());
// 把路由挂载到 app 中
app.use(router);
//路由http请求：app.method,app.param;

app.listen(3000, () => console.log('Example app listening on port 3000!'))
