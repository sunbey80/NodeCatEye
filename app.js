var mongoose = require('mongoose')
var jade = require('jade')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs')
var app = express()
var port = 3000

app.set('views','./views')
app.set('view engine','jade')
app.use(express.static(path.join(__dirname, '/static')))
app.use(express.static(path.join(__dirname, '/upload')))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.listen(port)
console.log('server is listening on port' + port)

//mongoose.connect('mongodb://sunbey:123456@ds149258.mlab.com:49258/cateye')
mongoose.connect('mongodb://127.0.0.1:27017/cateye')
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function (callback) {
  console.log('db service connected.')
})

//set schema
var moviesSchema = new mongoose.Schema({
  	title: String, //电影名
  	summary: String, //一句话概括
  	oninfor: String, //上映信息
  	want: String, //想看人数
  	score: {type:String,default:'0.0'}, //评分 默认0
  	sale: String, //销售状态
  	image: String, //电影封面
  	detail: String, //详细描述
  	view: {type:Number,default:0}, //查看次数
  	title_en: String, //电影英文名
  	sort: String, //所属分类
  	area: String, //所属地区
  	last_time: String, //时长（分钟）
  	actor: String, //演员
  	photos: String //剧照
})
//pub model
var blogModel = db.model('movies',moviesSchema)


//index page
app.get('/',function(req,res,next){
	res.redirect('/admin')
})

//detail page
app.get('/article/:id',function(req,res,next){

	var id = req.params.id

	blogModel.find({_id:id},function(err,articles){ //update view number +1

		//update view number
		blogModel.update({_id:id},{$inc:{view:1}},function(err){

			//render aiticle page
			res.render('article', {title:'Movies',articles:articles})

		})
			
	})

})

//admin_list page
app.get('/admin',function(req,res,next){

	blogModel.find(function(err,articles){
	    res.render('admin_list', {title:'Movies',articles:articles})
	})
})

//admin_edit page
app.get('/edit/:id',function(req,res,next){

	var id = req.params.id

	blogModel.find({_id:id},function(err,articles){
		articles.forEach(function(item,err){

			res.render('admin_edit', {title:'Movies',article:item,uploadImg:'0'})

		})
	})
})

//admin_gotowrite page
app.get('/write',function(req,res,next){

    res.render('admin_edit', {
    	title:'Movies',
    	article:{
    		title:'',
    		summary:'',
    		oninfor:'',
    		want:'',
    		score:'',
    		sale:'0',
    		image:'',
    		detail:'',
    		title_en: '', 
    		sort: '',
    		area: '',
    		last_time: '',
    		actor: '',
    		photos: ''
    	},
    	uploadImg:'0'
    })

})

//admin_edit_submit process or add new write process
app.post('/editSubmit/:id',function(req,res,next){

	var urlId = req.params.id //urlId: 1- upload image; 0- don't upload image

	var form = new multiparty.Form()
	form.encoding = 'utf-8'
	if(urlId === '1'){
		form.uploadDir = "upload/movieImgs/"
		form.maxFilesSize = 5 * 1024 * 1024	
	}
	form.parse(req, function(err, fields, files) {
		
		var id = fields._id[0]
		var title = fields.title[0]
		var summary = fields.summary[0]
		var oninfor = fields.oninfor[0]
		var want = fields.want[0]
		var score = fields.score[0]
		var sale = fields.sale[0]
		var image = fields.image[0]
		var detail = fields.detail[0]
		var title_en = fields.title_en[0]
		var sort = fields.sort[0]
		var area = fields.area[0]
		var last_time = fields.last_time[0]
		var actor = fields.actor[0]
		var photos = fields.photos[0]

		var setObj = {
			title: title,
			summary: summary,
		  	oninfor: oninfor,
		  	want: want,
		  	score: score,
		  	sale: sale,
		  	image: image,
		  	detail: detail,
		  	title_en: title_en,
		  	sort: sort,
		  	area: area,
		  	last_time: last_time,
		  	actor: actor,
		  	photos: photos
		}
		
		if(urlId === '1'){
			var fileOne = files.upload[0]
			var originalFile = fileOne.originalFilename
			var oFileType = originalFile.substring(originalFile.lastIndexOf('.'))
			var nameRandom = 'movie' + new Date().getTime()
			var uploadImage = nameRandom + oFileType
			//rename file
			fs.renameSync(fileOne.path,form.uploadDir + uploadImage)

			//render admin_admin.jade
			res.render('admin_edit',{
	    		title:'Movies',
				article:{
					_id: id,
					title: title,
					summary: summary,
					oninfor: oninfor,
					want: want,
					score: score,
					sale: sale,
					image: uploadImage,
					detail: detail,
				  	title_en: title_en,
				  	sort: sort,
				  	area: area,
				  	last_time: last_time,
				  	actor: actor,
				  	photos: photos
				},
	    		uploadImg:'0'
			})
		}else 
		if(urlId === '0'){
			var uploadImage = fields.image[0]

			//add data to database
			if(id !== 'undefined'){ //update
				blogModel.update({
					_id:id
				},{
					$set: setObj
				},function(err){
					console.log(err)
				})
				//render aiticle page
				res.redirect('/admin')

			}else{ //new add
				var data = new blogModel(setObj)
				data.save()

				//render admin page
				res.redirect('/admin')
			}
		}
		
	})
	
})

//admin_delete process
app.get('/delete/:id',function(req,res,next){

	var id = req.params.id
	
	blogModel.remove({_id:id},function(err){
		
		//render admin page
		res.redirect('/admin')
	})
})

//data API
//movies
app.get('/APImovies',function(req,res,next){

	if(req.query.onsale){
		var onsale = req.query.onsale

		//search by onsale
		if(onsale!=='undefined' && onsale==='true'){
			blogModel.find({sale:{$in:['1','2']}},function(err,movies){
				res.send(movies)
			})
		}else if(onsale!=='undefined' && onsale==='false'){
			blogModel.find({sale:'0'},function(err,movies){
				res.send(movies)
			})
		}
	}else

	if(req.query._id){
		var id = req.query._id

		if(id!=='undefined'){
			blogModel.find({_id:id},function(err,movies){
				res.send(movies)
			})
		}
	}

})





