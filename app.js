//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
// const bcrypt=require("bcrypt");
// const saltRounds = 10;
// const md5=require("md5"); //for better security we provide hashing
//const encrypt = require("mongoose-encryption"); //encrypted using AES-256-CBC 
//const _=require("lodash"); //for captialize the string
// const date = require(__dirname + "/date.js");


const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true }
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});


const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//userSchema.plugin(encrypt, { secret:process.env.SECRET,encryptedFields: ["password"] }); // For  encryption 

const User =new mongoose.model("User",userSchema);


passport.use(User.createStrategy());

//works just for local strategy as used passport-local-mongoose here.
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//Valid for strategy i.e. google,local etc used here as we use this from passport js.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//it is put here because after intializing and after creating a session we need of this redirection so...
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //it provides all the things that google provides to us in form of json.
    //console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

//to redirect to auth page as it was been transfered as we pressed google button declared in register.ejs and login.ejs
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));  //Will use google strategy declared above and will give profile info that contains email and user id.

//to redirect the url i.e declared auth/google/secrets on developers engine after successfully authenticating and storing the cookies and session.
//And will locally authenticate user by session and cookies.

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }), //If any failures occurs then will be redirected to login page.
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });


app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){  //Anybody login or not log in will see our secrets and so here authentication is not needed.
  
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }
    else
    {
      if(foundUsers){
        res.render("secrets",{usersWithSecrets:foundUsers});
      }
    }
  });
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else
  {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedsecret=req.body.secret;
  //console.log(req.user.id);
  //here passport makes everything save of current user in req.
  User.findById(req.user.id,function(err,foundUser){
    if(err)
    {
      console.log(err);
    }
    else
    {
      if(foundUser){
        foundUser.secret=submittedsecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});


app.get("/logout",function(req,res){
  req.logout(function(err){
    if (err) { console.log(err); }
  res.redirect("/");
});
});



app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
        // res.render("secrets");
      });
    }
  });
  
});

app.post("/login",function(req,res){
  
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
        // res.render("secrets");
      });
    }
  });
});

app.listen(3000, function() {
  console.log("Server started");
});
