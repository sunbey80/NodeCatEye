var mongoose = require('mongoose')
var jade = require('jade')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var port = 3000

app.set('views','./views')
app.set('view engine','jade')
app.use(express.static(path.join(__dirname, '/static')))

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
  	score: String,
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

			res.render('admin_edit', {title:'Movies',article:item})

		})
	})
})

//admin_gotowrite page
app.get('/write',function(req,res,next){

    res.render('admin_edit', {title:'Movies',article:{title:'',detail:''}})

})

//admin_edit_submit process or add new write process
app.post('/editSubmit',function(req,res,next){

	var id = req.body._id
	var title = req.body.title
	var detail = req.body.detail

	if(id !== 'undefined'){ //update
		blogModel.update({
			_id:id
		},{
			$set:{
				title:title,
				detail:detail
			}
		},function(err){
			//render aiticle page
			res.redirect('/admin')
		})

	}else{ //new add
		var data = new blogModel({
			title:title,
			summary: '',
		  	oninfor: '',
		  	score: '',
		  	image: '',
		  	detail: detail,
		  	view: 0
		})
		data.save()

		//render admin page
		res.redirect('/admin')
	}
	
})

//admin_delete process
app.get('/delete/:id',function(req,res,next){

	var id = req.params.id
	
	blogModel.remove({_id:id},function(err){
		
		//render admin page
		res.redirect('/admin')
	})
})





