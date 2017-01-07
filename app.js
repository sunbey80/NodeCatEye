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

mongoose.connect('mongodb://sunbey:123456@ds149258.mlab.com:49258/cateye')
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function (callback) {
  console.log('db service connected.')
})

//set schema
var moviesSchema = new mongoose.Schema({
  	title: String,
  	summary: String,
  	oninfor: String,
  	want: String,
  	score: {type:String,default:'0.0'},
  	sale: String,
  	image: String,
  	detail: String,
  	view: {type:Number,default:0}
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
    	},
    	uploadImg:'0'
    })

})

//admin_edit_submit process or add new write process
app.post('/editSubmit/:id',function(req,res,next){

	var urlId = req.params.id

	var form = new multiparty.Form()
	form.encoding = 'utf-8'
	if(urlId === '1'){
		form.uploadDir = "upload/movieImgs/"
		form.maxFilesSize = 2 * 1024 * 1024	
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
					image:uploadImage,
					detail: detail,
				},
	    		uploadImg:'0'
			})
		}else 
		if(urlId === '0'){
			var uploadImage = fields.image[0]

			//add data to database
			console.log(id)
			if(id !== 'undefined'){ //update
				console.log(0)
				blogModel.update({
					_id:id
				},{
					$set:{
						title: title,
						summary: summary,
					  	oninfor: oninfor,
					  	want: want,
					  	score: score,
					  	sale: sale,
					  	image: image,
					  	detail: detail
					}
				},function(err){
					console.log(err)
				})
				//render aiticle page
				res.redirect('/admin')

			}else{ //new add
				console.log(0)
				var data = new blogModel({
					title: title,
					summary: summary,
				  	oninfor: oninfor,
				  	want: want,
				  	score: score,
				  	sale: sale,
				  	image: image,
				  	detail: detail,
				  	view: 0
				})
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
	var onsale = req.query.onsale

	if(onsale!=='undefined' && onsale==='true'){
		blogModel.find({sale:{$in:['1','2']}},function(err,movies){
			res.send(movies)
		})
	}else if(onsale!=='undefined' && onsale==='false'){
		blogModel.find({sale:'0'},function(err,movies){
			res.send(movies)
		})
	}
	
})





