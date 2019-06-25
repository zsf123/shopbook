var connection = require('./database'); //连接数据库
 var imgFileNameArray = require('../public/img/book/path'); //获取图片完成路径
 let path = require('path');

 //获取所有图片的名称
 var imgName = [];
 for (var i = 0; i < imgFileNameArray.length; i++) {
 	var name = path.basename(imgFileNameArray[i], '.jpg'); //获取图片名称
 	imgName.push(name);

 }
 imgName.splice(0, 1);
// console.log(connection);


//  // 创建sql语句
//  connection.connect();
// 
// 
// 
//  
//  
//  // 为所有书籍添加图片路径
//  	for (var i = 0; i < imgFileNameArray.length; i++) {
// 		var name = path.basename(imgFileNameArray[i], '.jpg');//获取
// 		// var sqls='update books set imageurl = ? where bookname like '+"%"+'?'+"%";//不可以
// 		var updatesql='update books set imageurl = ? where bookname like concat(?,"%")';
// 		var param=[ imgFileNameArray[i],name];
// 		
// 		 connection.query(updatesql,param,function(err, result) {
// 			if (err) {
// 				console.log('[SELECT ERROR] - ', err.message);
// 				return;
// 			}
// 			// console.log(updatesql);
// 			})
//  	}
// 	 connection.end();
	 // 创建sql语句
	 var books = [];
	connection.connect();
 //查询所有书籍

 var sql = 'SELECT * FROM books limit 0,5';

 connection.query(sql, function(err, result) {
 	if (err) {
 		console.log('[SELECT ERROR] - ', err.message);
 		return;
 	}
// 	console.log(result);
//  	books = result;
books=result;
	// console.log(result)
	console.log("sql.js中的books：")
	// console.log(books);
	 // module.exports=result;
// console.log("sql.js中的books： "+books.toString());

//  	for (var i = 0; i < books.length; i++) {
//  		console.log(books[i].bookname);
//  	}
 });
	 connection.end();

 module.exports=books;

// 从图书表中查询出每个区域的分类号并去重：用于建立分类表和区域表的中间表
select  distinct substring(books.class_num,1,1) as category from books where books.library_area='少儿读本区'
//找出了分类，还要一个一个标出，然后打点，最后去掉点
update `book_category` set `flag`=replace(`flag`,'.','');

// 查询出所有属于某个分类的书籍
select * from books where substring(books.call_num,1,1)=?