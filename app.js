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

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true }
}));


app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});
app.get("/",function(req,res){
  res.render("home");
});

const userSchema=new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt, { secret:process.env.SECRET,encryptedFields: ["password"] }); // For  encryption 

const User =mongoose.model("User",userSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else
  {
    res.redirect("/login");
  }
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
