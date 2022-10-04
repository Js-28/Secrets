//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bcrypt=require("bcrypt");
const saltRounds = 10;
// const md5=require("md5"); //for better security we provide hashing
//const encrypt = require("mongoose-encryption"); //encrypted using AES-256-CBC 
//const _=require("lodash"); //for captialize the string
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});
app.get("/",function(req,res){
  res.render("home");
});

const userSchema=new mongoose.Schema({
  email:String,
  password:String
});



//userSchema.plugin(encrypt, { secret:process.env.SECRET,encryptedFields: ["password"] }); // For  encryption 

const User =mongoose.model("User",userSchema);


app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});



app.post("/register",function(req,res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser=new User({
    email:req.body.username,
    password:hash
  });

  newUser.save(function(err){
    if(err)
    {
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
    
  });
  
});

app.post("/login",function(req,res){
  const username= req.body.username;
  const password= req.body.password;

  User.findOne({email:username},function(err,foundUser){
      if(err){
        console.log(err);
      }
      else
      {
          if(foundUser){
            // if(foundUser.password === password)
            // {
              bcrypt.compare(req.body.password,foundUser.password, function(err, result) {
                  if(result===true)
                  {
                    res.render("secrets");
                  }
              });
              
            //}
          }
      }
  });
});

app.listen(3000, function() {
  console.log("Server started");
});
