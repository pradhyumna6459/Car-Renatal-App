const passport=require('passport');
const localStrategy=require('passport-local').Strategy;
const User=require('../models/users');
const bcrypt=require('bcryptjs');
passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(err,user);

    });
});
passport.use(new localStrategy({
    usernameField:'email',
    passwordField:'password'
},(email,passport,done)=>{
    User.findOne({email:email})
    .then((user)=>{
        if(!user)
        {
            return done(null,false);

        }
        bcrypt.compare(passport,user.password,(err,isMatch)=>{
            if(err)
            {
                return done(err);
            }
            if(isMatch)
            {
                return done(null,user);
            }
            else{
                return done(null,false);
            }
        })
    }).catch((err)=>{
        console.log(err);
    });
}));