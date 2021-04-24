const express=require('express');
const ejs=require('ejs');
const app=express();
const bodyParser=require("body-parser");
const mongoose=require('mongoose');
const User=require('./models/users');
const Car=require('./models/car');
const MongoDB=require('./config/dev');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const passport=require('passport');
const bcrypt=require('bcryptjs');
const {requireLogin,ensureGuest}=require('./helpers/authhelper');
const {upload}=require('./helpers/aws');
require('./passport/local');
const formidable=require('formidable');
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(cookieParser());
app.use(session({
    secret:'my',
    resave:true,
    saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
    res.locals.user=req.user||null;
    next();
});

mongoose.connect(MongoDB.MongoDB,{ useNewUrlParser: true },function(req,res){
    
    console.log("MongoDB is connected");
});
const port=3000;
app.get('/',ensureGuest,function(req,res){
    res.render('home',{title:'Home'});
});
app.get('/about',ensureGuest,function(req,res){
    res.render('about',{title:'About'});
});
app.get('/contact',function(req,res){
    res.render('contact',{title:'Contact us'});
});
app.get('/signup',ensureGuest,function(req,res){
    res.render('signup',{err:[]});
});
app.listen(port,function(req,res){
    console.log("app is running at "+port);
});
app.post('/register',(req,res)=>{
    let err=[]
    if(req.body.password!==req.body.password2)
    {
        err.push({text:'Password doesnot match'});
    }
    else if(req.body.password.length<5)
    {
        err.push({text:'Password length should atleast be 5 character long'});
    }
    if(err.length>0)
    {
        //console.log(err);
        res.render('signup',{err:err});
    }
    if(req.body.password===req.body.password2) {
        User.findOne({email:req.body.email},function(err,user)
        {
            if(user)
            {
                let err=[]
                err.push({text:'email already exits'});
                //console.log(err);
                res.render('signup',{err:err});

            }
            else{

                let salt=bcrypt.genSaltSync(10);
                let hash=bcrypt.hashSync(req.body.password,salt);
                
                const newuser={
                    firstname:req.body.firstname,
                    lastname:req.body.lastname,
                    email:req.body.email,
                    password:hash,
                    phone:req.body.phone
                    

                }
                console.log(newuser);
                new User(newuser).save(function(err,user)
                {
                    if(err)
                    {
                        console.log(err);
                    }
                    else{
                        var l="You have sucessfully created an Account! you can Login now";
                        console.log("Successfully added user");
                        res.render('login',{message:l});
                    }
                })
            }

        });
    }
});
app.get('/email',ensureGuest,function(req,res)
{
    res.render('login',{message:""});
});
app.post('/login',passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect:'/loginerr',
}));
app.get('/loginerr',function(req,res)
{
    res.render('loginerr',{err:"Your Account doesnot exits you can create your account"});
});
app.get('/profile',requireLogin,function(req,res)
{
    User.findById({_id:req.user._id},function(err,user){
        if(user)
        {
            //console.log(user);
            user.online=true;
            user.save((err,user)=>{
                if(err)
                {
                    throw err;
                }
                else{
                    res.render('profile',{user:user});
                }
            })
            
        }
        else{
            console.log(err);
        }

    });
});
app.get('/logout',function(req,res) {
    User.findById({_id:req.user._id},function(err,user)
    {
        if(err)
        {
            throw err;
        }
        else{
            user.online=false;
            user.save(function(err,user)
            {
                if(err)
                {
                    throw err;
                }
                else{
                    req.logout();
                    res.redirect('/');
                }
            });
        }
    })
    
});
app.get('/listcar',requireLogin,function(req,res){
    res.render('listcar',{})
});
app.post('/listcar',function(req,res){
    console.log(req.body.image);
    const s="https://carrentalapp6459.s3.ap-south-1.amazonaws.com/"+req.body.image;
    const newcar={
        owner:req.user._id,
        make:req.body.make,
        model:req.body.model,
        year:req.body.year,
        priceperhour:req.body.priceperhour,
        priceperweek:req.body.priceperweek,
        location:req.body.location,
        image:s,
        type:req.body.type

    }
    new Car(newcar).save((err,car)=>{
        if(err)
        {
            console.log("fail");
        }
        if(car)
        {
            console.log(car);
            res.redirect('/showcar');

        }
    })

});
app.post('/uploadImage',upload.any(),function(req,res){
    const form=new formidable.IncomingForm();
    form.on('file',(field,file)=>{
        console.log(file);
    });
    form.on('error',(err)=>{
        console.log(err);
    });
    form.on('end',()=>{
        console.log("success");
    });
    form.parse(req);

});
app.get('/showcar',requireLogin,function(req,res){
    Car.find({})
    .populate('owner')
    .sort({data:'desc'})
    .then((cars)=>{
        res.render('showcar',{cars:cars});
    })

});