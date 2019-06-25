var express = require("express");
var router = express.Router();
var http = require('http');
var connection = require('./database/database'); //连接数据库
var imgFileNameArray = require('./public/img/book/path'); //获取图片绝对路径
let path = require('path');
var RandomString = require("./public/js/util");

// ----------------------------------------------------------------------
// 创建链接
connection.connect();

// /user/:uid/photos/:file
//获取所有图片的名称
var imgName = [];
for (var i = 0; i < imgFileNameArray.length; i++) {
	var name = path.basename(imgFileNameArray[i], '.jpg'); //获取图片名称
	imgName.push(name);

}
imgName.splice(0, 1);
//  // 为所有书籍添加图片路径
// for (var i = 0; i < imgName.length; i++) {
// 	var updatesql = 'update books set imageurl = ? where bookname like concat("%",?,"%")';
// 	var param = ['http://localhost:3000/public/img/book/' + imgName[i] + '.jpg', imgName[i]];
// 
// 	connection.query(updatesql, param, function(err, result) {
// 		console.log("执行了插入图片路径操作")
// 		if (err) {
// 			console.log('[SELECT ERROR] - ', err.message);
// 			return;
// 		}
// 	})
// }
// var books = []; //所有书籍


// 关闭链接
// connection.end();
// ------------------------------------------------------------------------



//通用的Sql查询语句------------------------------------------------------------------------------------
function connectSelect(sql) {
	return new Promise(function(resolve) {
		connection.query(sql, function(err, result) {
			if (err) {
				console.log('[SELECT ERROR] - ', err.message);
				return;
			}
			resolve(result);
		});
	})
}


//创建通用插入语句
function connectInsert(sql, params) {
	connection.query(sql, params, function(err, result) {
		if (err) {
			console.log('[SELECT ERROR] - ', err.message);
			return;
		}
	});
}


//通用的Sql语句-------------------------------------------------------------------------------------
router.get("/getKeyWords", (req, res) => {
	var keyWords = []
	var sql = "select bookname from books"; //查询出所有书名
	connectSelect(sql).then(val => {
		for (var i = 0; i < val.length; i++) {
			keyWords.push(val[i].bookname);
		}
		console.log(keyWords);
		res.json(keyWords);
	})

});

// 定义全局变量-----------------------------------------------------------------------------

//查询所有书籍信息
var books = [];
//查询所有书籍分类信息
var categoryList = [];
// 查询部分书籍信息
var bookList = [];
// 通过首页搜索条件搜索到的书籍清单数组对象
var bookListByParams = [];
// 三种网站导航分类
var youthNavigate = [];
var childrenNavigate = [];
var babyNavigate = [];
var navgateObj = {
	youthNavigate: [],
	childrenNavigate: [],
	babyNavigate: []
};
//定义全局变量-------------------------------------------------------------------------------------


// 页面一加载就查询出首页需要的数据-------------------------------------------------------------------
// 查询首页书籍信息
var sql = 'SELECT * FROM books limit 1,10';
connectSelect(sql).then(val => {
		books = val;

		//查询所有书籍分类信息
		var categorySql = 'SELECT * FROM book_category';
		return connectSelect(categorySql);
	})
	.then(val => {
		categoryList = val;

		// 查询部分书籍信息
		var bookListSql = 'SELECT * FROM books limit 1001,30';
		return connectSelect(bookListSql);
	})
	.then(val => {
		bookList = val;

		// 查询首页分类导航所需数据
		// 查询成人读本区的书籍分类名称
		var youthsql =
			"select book_category.categoryname from book_category where book_category.id in(select area_book.book_category_id from area_book where area_book.area_category_id=1)";
		connectSelect(youthsql).then(val => {
			youthNavigate = val;
			// 查询少儿读本区的书籍分类名称
			var childrensql =
				"select book_category.categoryname from book_category where book_category.id in(select area_book.book_category_id from area_book where area_book.area_category_id=2)";
			return connectSelect(childrensql);
		}).then(val => {
			childrenNavigate = val;
			// 查询低幼读本区的书籍分类名称
			var babysql =
				"select book_category.categoryname from book_category where book_category.id in(select area_book.book_category_id from area_book where area_book.area_category_id=3)";
			connectSelect(babysql).then(val => {
				babyNavigate = val;
			});
		});
	}).then(val => {
		router.get('/', (req, res) => {

			res.render('index.html', {
				books: books,
				category: categoryList,
				booklist: bookList,
				webnavigate: {
					youthNavigate: youthNavigate,
					childrenNavigate: childrenNavigate,
					babyNavigate: babyNavigate
				},
				User: req.session.USER
			})

		});
	})

// 以上为首页一加载就需要的数据--------------------------------------------------------------------------------------
// navgateObj = {
// 			youthNavigate: youthNavigate,
// 			childrenNavigate: childrenNavigate,
// 			babyNavigate: babyNavigate
// 		}




// 路由跳转-----------------------------------------------------------------------------------------------
// 跳转到首页
// router.get('/', (req, res) => {
// 
// 	res.render('index.html', {
// 		books: books,
// 		category: categoryList,
// 		booklist: bookList,
// 		webnavigate: {
// 			youthNavigate: youthNavigate,
// 			childrenNavigate: childrenNavigate,
// 			babyNavigate: babyNavigate
// 		},
// 		User: req.session.USER
// 	})
// 
// });


// 配置中间件
// 跳转到登录页
router.get('/login', (req, res) =>
	res.render('login.html', {
		cookie: req.cookies.cUser
	})); //// 渲染http请求


// ---------------------------------------------------------------------------
// 用户注册登录逻辑
router.get('/demo', (req, res) => {
	res.render("demo.html");
});


// 用户登录(用户登录成功，要将用户信息存入session和cookie(记住用户名或密码)中)
router.post('/login', function(req, res) {

	console.log("cookie为：" + JSON.stringify(req.cookies));
	console.log("params:" + JSON.stringify(req.body));
	var params = req.body;
	var User = null; //最后登录成功的用户对象
	if (params.username != '' || params.username != null && params.password != '' || params.password != null) {
		var userInfo = []; //数据库根据用户名查询到的用户对象（有可能重名，所以是数组）
		var username = JSON.stringify(params.username);
		//查询出所有用户信息
		var userInfoSql = 'SELECT * FROM users where users.username=' + username;
		console.log(userInfoSql);
		connectSelect(userInfoSql).then(val => {
			userInfo = val;
			if (userInfo != null && userInfo != '') {
				Object.keys(userInfo).forEach(function(index) {
					var item = userInfo[index];
					//找到登录的用户对象数据
					User = item;
					if (params.password == item.password) { //此时只要判断密码即可
						// 登录成功，将用户信息存入 session,此时会向客户端返回一个connect.sid保存的是当前登录保存在服务端sessionid用户
						var obj = {
							sessionid: RandomString,
							user: User
						}
						req.session.USER = User;
						req.session.sessionid = RandomString;
						// 也将用户数据存入cookie中一份
						res.cookie("USER", obj, {
							maxAge: 900000,
							httpOnly: true
						})
						//如果用户点击了记住用户名，将登录信息存入cookie
						if (params.remeusername == true) {
							res.cookie('cUser', '');
							res.cookie('cUser', params, {
								maxAge: 900000,
								httpOnly: true
							});
						}
						// 渲染首页
						res.render('index.html', {
							books: books,
							category: categoryList,
							booklist: bookList,
							webnavigate: {
								youthNavigate: youthNavigate,
								childrenNavigate: childrenNavigate,
								babyNavigate: babyNavigate
							},
							User: User
						});
					} else {
						var msg = "密码错误，请重新登录";
						res.render("login.html", {
							msg: msg
						});
					}
				});
			} else {
				var msg = "用户名输入错误，请重新输入";
				res.render("login.html", {
					msg: msg
				});
			}
		});
	} else { //这里可以不用，因为字段上填写了必填项
		var msg = "用户名或密码不能为空，请重新输入";
		res.render("login.html", {
			msg: msg
		});
	}
});


// 用户退出登录
router.get('/logout', (req, res) => {
	req.session.USER = null;
	req.session.sessionid = null;
	res.redirect('/');
});


// 判断用户是否登录
router.get("/userflag", (req, res) => {
	// 如果session中没有说明用户未登录
	console.log("session中的值：" + JSON.stringify(req.session));
	if (req.session.USER == null || req.session.USER == '' || req.session.sessionid == null || req.session.sessionid ==
		'') {
		res.json({
			code: 500,
			success: "failed"
		})
		// 如果sessionid一样说明登录
	} else if (req.cookies.USER.sessionid == req.session.sessionid) {
		console.log("cookie的sessionid:" + req.cookies.USER.sessionid + "session的sessionid:" + req.session.sessionid)
		res.json({
			code: 200,
			success: "success"
		})
	} else {
		res.json({
			code: 500,
			success: "success"
		})
	}
});


router.get("/demo1", (req, res) => {
	console.log(req.session.USER);
	res.send("成功");
})
//---------------------------------------------------------------------
// 跳转书籍详情页
router.get('/bookdetail/id/:Id', (req, res) => {
	// 定义获取到的对象
	var book = null;
	var id = req.params.Id; //获取到路径参数
	var sql = "select * from books where books.id=" + id;
	console.log("-----------------" + sql);
	connectSelect(sql).then(val => {
		console.log(val);
		book = val[0]; //这里val获取到的是一个有一个对象的数组
		console.log("当前用户为：" + req.session.USER)
		res.render('bookdetail.html', {
			book: book,
			User: req.session.USER,
			webnavigate: {
				youthNavigate: youthNavigate,
				childrenNavigate: childrenNavigate,
				babyNavigate: babyNavigate
			},
		});
	})
})

// 根据条件查询书籍信息-----响应ajax请求----------------------------------------------
router.get("/searchBookList", (req, res) => {
	var params = req.query.param; //这里的param是我自己起的参数名字
	var bookListByParamsSql = 'SELECT * FROM books where bookname like concat("%","' + params + '","%") limit 0,50';
	connectSelect(bookListByParamsSql).then(val => {
		bookListByParams = val; //将根据条件查询到的书籍信息存入事先定义好的数组中，方便跳转书籍列表页的时候渲染数据
		var searchBookList = [];
		Object.keys(bookListByParams).forEach(function(index) {
			searchBookList.push(bookListByParams[index]);
		})
		res.json({
			'code': "success",
			'content': 'booklist'
		});
	});
})

// 根据搜索条件跳转到书籍列表页
router.get("/booklist", (req, res) => {
	//获得查询书籍个数，购物车为空的时候也要用到这个接口
	var num = req.query.num;
	if (num != null && num != '') {
		var sql = "select * from books limit 0," + num;
		connectSelect(sql).then(val => {
			bookListByParams = val; //如果有个数就根据个数封装书籍数据，没有就根据上面已经查询到的封装
		})
	}
	res.render('booklist.html', {
		books: bookListByParams,
		webnavigate: {
			youthNavigate: youthNavigate,
			childrenNavigate: childrenNavigate,
			babyNavigate: babyNavigate
		},
		User: req.session.USER
	})
})
router.get("/booklist/more", (req, res) => {
	//获得查询书籍个数，购物车为空的时候也要用到这个接口
	var start = req.query.start;
	var addnum = req.query.addnum;
	if(start>=500){
		start=500;
	}
		var sql = "select * from books limit " +start+","+addnum;
		console.log(sql);
		connectSelect(sql).then(val => {
			console.log(val);
			res.json({
				data:val
			});
		})
})



// 根据书籍分类标识跳转到书籍列表页
router.get("/booklist/categoryflag/:Categoryflag", (req, res) => {
	var flag = req.params.Categoryflag;
	var sql = 'select * from books where substring(books.call_num,1,1)="' + flag + '" limit 0,50';
	console.log(sql);
	connectSelect(sql).then(val => {
		res.render('booklist.html', {
			books: val,
			User: req.session.USER,
			webnavigate: {
				youthNavigate: youthNavigate,
				childrenNavigate: childrenNavigate,
				babyNavigate: babyNavigate
			},
		})
	});
});

router.get("/booklist/areaname/:areaname/categoryname/:categoryname", (req, res) => {
	var areaname = req.params.areaname;
	var categoryname = req.params.categoryname;
	var sql = "select  * from books where books.library_area='" + areaname +
		"'  and substring(call_num,1,1)=(select book_category.flag from book_category  where book_category.categoryname='" +
		categoryname + "') limit 0,50";
	connectSelect(sql).then(val => {
		res.render('booklist.html', {
			books: val,
			webnavigate: {
				youthNavigate: youthNavigate,
				childrenNavigate: childrenNavigate,
				babyNavigate: babyNavigate
			},
			User: req.session.USER
		})
	});
})




// ----------------------------------------------------------------------------
// 定义一个全局购物车小计数组
var smallpricelist = [];
// 跳转到购物车页面
router.get("/shopcar", (req, res) => {
	// 到购物车表中查询数据
	var sql =
		"select *,shopping.id as shoppingcartid from books inner join (select * from shopping_cart where userid=" +
		req.session.USER.id +
		") as shopping on books.id=shopping.productid";
	connectSelect(sql).then(val => {
		// var totalprice = [];
		for (var i = 0; i < val.length; i++) {
			var price = val[i].itemprice.substring(1);
			var count = val[i].count;
			// 向每个购物项中添加总价格:四舍五入了
			val[i].totalprice = (price * count).toFixed(2); //sql查询出的是一个数组，数组中是一个个对象，js对象添加属性的方式是.出来
			smallpricelist.push(val[i].totalprice); //单独封装一个小计数组
		}

		res.render("shopcar.html", {
			shopcar: val,
			webnavigate: {
				youthNavigate: youthNavigate,
				childrenNavigate: childrenNavigate,
				babyNavigate: babyNavigate
			},
			User: req.session.USER
		});
	});

})
// 根据索引获得给定购物项的小计
router.get("/shopcar/index/:index", (req, res) => {
	var smallpricelist = [];
	var sql =
		"select *,shopping.id as shoppingcartid from books inner join (select * from shopping_cart where userid=" +
		req.session.USER.id +
		") as shopping on books.id=shopping.productid";
	connectSelect(sql).then(val => {
		for (var i = 0; i < val.length; i++) {
			var price = val[i].itemprice.substring(1);
			var count = val[i].count;
			// 向每个购物项中添加总价格:四舍五入了
			val[i].totalprice = (price * count).toFixed(2); //sql查询出的是一个数组，数组中是一个个对象，js对象添加属性的方式是.出来
			smallpricelist.push(val[i].totalprice); //单独封装一个小计数组
		}
		var index = req.params.index;
		res.json({
			smallprice: smallpricelist[index]
		})
		console.log("购物项的小计" + smallpricelist + "-----" + smallpricelist[index] + "----" + index);
	});
})


// 加入购物车逻辑，添加新的购物项，数据项持久化了
router.post("/addcart", (req, res) => {
	var param = req.body;
	var book = JSON.parse(param.book);
	var num = JSON.parse(param.num);
	// 思路：首先查询出该用户的购物车，在该购物车里寻找是否有当前购物项
	// ，如果有修改购物项数量，如果没有添加新的购物项
	var userid = req.session.USER.id;
	var selectSql = "select * from shopping_cart where userid=" + userid;
	console.log(selectSql);
	var shoppingItems = []; //查询出的所有购物项
	var flag = 0; //标识是否更新了商品数量，如果未更新，则添加新的购物项。1：代表更新了，
	// 查询当前登陆用户的所有购物项
	connectSelect(selectSql).then(val => {
		if (val != null && val != '') {
			shoppingItems = val;
			// 循环遍历每个购物项，比较bookid是否相等
			Object.keys(shoppingItems).forEach(function(index) {
				if (shoppingItems[index].productid == book.id) {
					var shopitem = shoppingItems[index];
					var updateSql = "update shopping_cart set count=?  where id=?";
					var selectparam = [num + shopitem.count, shopitem.id];
					console.log(updateSql);
					connectInsert(updateSql, selectparam);
					flag = 1; //更新了
				}
			});
			//新的购物项添加 
			if (flag == 0) {
				var insertSql = "insert into shopping_cart(productid,userid,productname,count,itemprice) values(?,?,?,?,?)";
				var paramList = [book.id, userid, book.bookname, num, book.price];
				connectInsert(insertSql, paramList);
			}
		} else {
			//新的购物项添加 
			var insertSql = "insert into shopping_cart(productid,userid,productname,count,itemprice) values(?,?,?,?,?)";
			var paramList = [book.id, userid, book.bookname, num, book.price];
			connectInsert(insertSql, paramList);
		}

		res.json({
			success: "success",
		});
	});

});

// 查询当前用户的购物项总数量
router.get("/shoppingCarCount", (req, res) => {
	var userid = req.session.USER.id;
	var sql = "select count from shopping_cart where userid=" + userid;
	var totalCount = 0;
	connectSelect(sql).then(val => {
		for (var i = 0; i < val.length; i++) {
			totalCount += val[i].count;
		}
		res.json({
			totalCount: totalCount
		});
	});
});


// 删除购物项
router.get("/shopcar/del/id/:id", (req, res) => {
	var id = req.params.id;
	var sql = "delete from shopping_cart where id=" + id;
	connectSelect(sql).then(val => {
		if (val != null) {
			res.redirect("/shopcar");
		}
	})
});

// 添加和减少购物项的数量
router.get("/shopcar/addnum", (req, res) => {
	var num = req.query.num;
	var id = req.query.shoppingcartid;
	var sql = "update shopping_cart set count=" + num + " where id=" + id;
	connectSelect(sql).then(val => {
		res.json({
			code: 200,
			msg: "操作成功"
		})
	});
});

router.post("/shopcar/delall", (req, res) => {
	var idlist = req.body.idlist;
	for (var i = 0; i < idlist.length; i++) {
		var sql = "delete from shopping_cart where id = " + idlist[i];
		console.log("删除全部" + sql);
		connectSelect(sql);
	}
	res.json({
		msg: "删除成功"
	})
})










// 查询关键字
router.get('/keywords', (req, res) => {
	var keywordsSql = "select distinct keywords from books;";
	res.send(connectSelect(keywordsSql)); //// 渲染http请求
})


//查询阅览区域数据
router.get('/areaCategory', (req, res) => {
	var sql = 'SELECT * FROM area_category';
	res.json(connectSelect(sql));
})

// 跳转到注册页
router.get('/register', (req, res) =>
	res.render('register.html'));
//接收注册表单数据
router.post('/register', (req, res) => {
	console.log(req.body);
	var obj = req.body;
	var insertUser = "insert into users(username,password,sex,phone) values(?,?,?,?)";
	var registerParams = [obj.username, obj.password, obj.sex, obj.telephone];
	connectInsert(insertUser, registerParams);
	res.send("注册成功");
})

// 更改购物车购物项的数量，增加和减少要刷新页面，因为很多按钮用的是数据库的数据
router.get("/updateShoppingCartCount", (req, res) => {
	// 进行数据库入库操作
	var sql = "update shopping_cart set count=" + req.query.count + " where id=" + req.query.id;
	console.log(sql);
	connectSelect(sql).then(val => {
		res.json({
			msg: "修改成功"
		})
		// res.redirect("/shopcar");
	})
})


// 导出路由
module.exports = router
