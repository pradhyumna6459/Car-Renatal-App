// express and some basic packages
const express=require('express');
const ejs=require('ejs');
const socketIO=require('socket.io');
const http=require('http');
const app=express();
const bodyParser=require("body-parser");
const mongoose=require('mongoose');
// models
const User=require('./models/users');
const Car=require('./models/car');
const Chat=require('./models/chat');
const Budjet=require('./models/budjet');
// models end
//mongdb
const MongoDB=require('./config/dev');
//auth
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
    res.render('loginerr',{err:"Your Account doesnot exits you can create your account or worong password"});
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
    res.render('listcar',{});
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
            res.redirect('/listcar');

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
    .sort({priceperhour:'asc'})
    .then((cars)=>{
        res.render('showcar',{cars:cars});
    })

});
app.get('/contactowner/:id',requireLogin,function(req,res){
    const ownerid=req.params.id;
    User.findOne({_id:ownerid},function(err,owner)
    {
        if(owner)
        {
            res.render('ownerprofile',{owner:owner});
        }

    })


});
app.get('/RentNow/:id',(req,res)=>{
    const carid=req.params.id;
    Car.findOne({_id:carid},function(err,car){
        if(err)
        {
            console.log(err);
        }
        if(car)
        {
            console.log(car.owner);
            res.render('calculate',{
                car:car
            })
        }
    })
});
app.post('/calulateTotal/:id',(req,res)=>{
    Car.findOne({_id:req.params.id},function(err,car)
    {
        if(err)
        {
            console.log(err);
        }
        if(car)
        {
            const hour=parseInt(req.body.hour);
            const week=parseInt(req.body.week);
            var total=hour*car.priceperhour+week*car.priceperweek;
            const budjet={
                carID:req.params.id,
                total:total,
                renter:req.user._id,
                date:new Date

            }
            new Budjet(budjet).save(function(err,budjet)
            {
                if(err)
                {
                    console.log(err);
                }
                if(budjet)
                {
                    Car.findOne({_id:req.params.id},function(err,car)
                    {
                        if(err)
                        {
                            console.log(err);
                        }
                        if(car)
                        {
                            res.render('checkout',{budjet:budjet,car:car});
                        }
                    })
                }
            })
        }
    })
});


//socket connection server-client interaction
const server=http.createServer(app);
const io=socketIO(server);
io.on('connection',(socket)=>{
    console.log("Connected to client");
    app.get('/chatowner/:id',requireLogin,function(req,res){
        Chat.findOne({sender:req.params.id,receiver:req.user._id})
        .then((chat)=>{
            if(chat){
                chat.date=new Date();
                chat.senderRead=false;
                chat.receiverRead=true;
                chat.save()
                .then((chat)=>{
                    const id1='/chat/'+chat._id;
                    res.redirect(id1);
                }).catch((err)=>{console.log(err)});
            }
            else{
                Chat.findOne({sender:req.user._id,receiver:req.params.id})
                .then((chat)=>{
                    if(chat)
                    {   
                        chat.date=new Date();
                        chat.senderRead=true;
                        chat.receiverRead=false;
                        chat.save()
                        .then((chat)=>{
                            const id1='/chat/'+chat._id;
                            res.redirect(id1);
                        }).catch((err)=>{console.log(err)});

                    }
                    else{
                       


                        const newChat={
                            sender:req.user._id,
                            receiver:req.params.id,
                            date:new Date()
                        }
                        new Chat(newChat).save()
                        .then((chat)=>{
                            console.log(chat.id);
                            User.findOne({_id:req.user._id},function(err,user)
                            {
                                if(err)
                                {
                                    console.log(err);
                                }
                                if(user)
                                {
                                    user.chat.push(chat._id);
                                   
                                    user.save(function(err,user)
                                    {
                                        if(err)
                                        {
                                            console.log(err);
                                        }
                                    });
                                }
                            });
                            
                            User.findOne({_id:req.params.id},function(err,user)
                                {
                                    if(err)
                                    {
                                        console.log(err);
                                    }
                                    if(user)
                                    {
                                        
                                        user.chat.push(chat._id);
                                        user.save(function(err,user)
                                        {
                                            if(err)
                                            {
                                                console.log(err);
                                            }
                                        });
                                    }
                                });
                            const id1='/chat/'+chat._id;
                            res.redirect(id1);

                        }).catch((err)=>{
                            console.log(err);
                        })
                    }

                }).catch((err)=>{console.log(err)});
            }

        }).catch((err)=>{console.log(err)});
    });
    //handle post route of message
    app.post('/chat/:id',(req,res)=>{
        Chat.findById({_id:req.params.id})
        .populate('sender')
        .populate('receiver')
        .populate('dialogue.sender')
        .populate('dialogue.receiver')
        .then((chat)=>{
            const newDialogue={
                sender:req.user._id,
                
                date:new Date(),
                senderMessage:req.body.message
            }
            chat.dialogue.push(newDialogue)
            chat.save((err,chat)=>{
                if(err)
                {
                    console.log(err);
                }
                if(chat){
                    Chat.findOne({_id:chat._id})
                    .populate('sender')
                    .populate('receiver')
                    .populate('dialogue.sender')
                    .populate('dialogue.receiver')
                    .then((chat)=>{
                        res.render('chatroom',{chat:chat});

                    }).catch((err)=>{console.log(err)});
                }
            })
        })
    });
    // handle /chat/chat._id route
    app.get('/chat/:id',(req,res)=>{
        Chat.findOne({_id:req.params.id})
        .populate('sender')
        .populate('receiver')
        .populate('dialogue.sender')
        .populate('dialogue.receiver')
        .then((chat)=>{
            res.render('chatroom',{chat:chat})
        }).catch((err)=>
        {
            console.log(err);
        })
    }) 
    socket.on('disconnect',(socket)=>{
        console.log("Disconnected from client");

    });
});
server.listen(port,function(req,res){
    console.log("app is running at "+port);
});

