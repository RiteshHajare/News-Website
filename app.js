require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("node:https");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
const nextDay = 1000*60*60*24;
app.use(session({
  secret:process.env.SECRET,
  saveUninitialized:true,
  cookie:{maxAge:nextDay},
  resave:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/newsDB");
const arrray = [ ];
var userID = [ ];

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  comment : []
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  var login=null;
  var register = null;
  var logout = null;
  if (req.isAuthenticated()===false) {
    login = "<a type='button' href='/signin'  id='loginBtn' class='btn ' >Login</a>";
    register = "<a type='button' href='/register' id='registerBtn' class='btn '>Register</a>";
  } else {
    logout = "<button type='submit' href='/logout' class='btn' id='logoutBtn'>Logout</button>";


  }

  const userAgent = req.get('user-agent');
const options = {
    host: 'newsapi.org',
    path: '/v2/everything?q=everything&apiKey='+process.env.APIKEY,
    headers: {
        'User-Agent': userAgent
    }
}

  https.get(options, function (response) {
      let data;
      response.on('data', function (chunk) {

          if (!data) {
              data = chunk;
          }
          else {
              data += chunk;
          }
      });
      response.on('end', function () {
          const newsData = JSON.parse(data);
          arrray.push(newsData);
          res.render("home",{Logout:logout,Login:login,Register:register,newsData : newsData});
         });
  });

  });

app.get("/news/:dynamicNews",function(req,res){
  var login=null;
  var register = null;
  var logout = null;

  const requestedTitle = _.camelCase(req.params.dynamicNews);
  arrray[0].articles.forEach(function(article){
    const originalTitle = _.camelCase(article.title);

    if (requestedTitle === originalTitle ) {
      if (req.isAuthenticated()===false) {
        login = "<a type='button' href='/signin'  id='loginBtn' class='btn ' >Login</a>";
        register = "<a type='button' href='/register' id='registerBtn' class='btn '>Register</a>";
      } else {
        logout = "<button type='submit' href='/logout' class='btn' id='logoutBtn'>Logout</button>";
        console.log("yes");

      }
      const title = article.title;
      const content = article.content;
      const images = article.urlToImage;
      res.render("dynamicNews",{Logout:logout,title:title,content:content,images:images,Login:login,Register:register});
    }
    });
});

app.get("/register",function(req,res){

  res.render("register");
});

app.get("/about",function(req,res){
  var login=null;
  var register = null;
  var logout = null;

  if (req.isAuthenticated()===false) {
    login = "<a type='button' href='/signin'  id='loginBtn' class='btn ' >Login</a>";
    register = "<a type='button' href='/register' id='registerBtn' class='btn '>Register</a>";
  } else {
    logout = "<button type='submit' href='/logout' class='btn' id='logoutBtn'>Logout</button>";
    console.log("yes");

  }
  res.render("about",{Logout:logout,Login:login,Register:register});
});

app.get("/contact",function(req,res){
  var login=null;
  var register = null;
  var logout = null;

  if (req.isAuthenticated()===false) {
    login = "<a type='button' href='/signin'  id='loginBtn' class='btn ' >Login</a>";
    register = "<a type='button' href='/register' id='registerBtn' class='btn '>Register</a>";
  } else {
    logout = "<button type='submit' href='/logout' class='btn' id='logoutBtn'>Logout</button>";
    console.log("yes");

  }
  res.render("contact",{Logout:logout,Login:login,Register:register});
});

app.get("/signin",function(req,res){

  res.render("signin");
});



app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    }else {
      passport.authenticate("local")(req,res,function(){
        userID.push(req.user.id);
        console.log("register authenticated");
        res.redirect("/");
      });
    }
  });
});


app.post('/signin', passport.authenticate('local', {
  failureRedirect: '/signin'
}),function(req, res) {//success redirect "/"
  userID.push(req.user.id);
  res.redirect("/");
});


app.post("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    userID = [ ];
    res.redirect('/');
  });
});
app.post("/comment",function(req,res){
  if (req.isAuthenticated()===true) {
    User.findById(userID[0],function(err,user){
      user.comment.push(req.body.comment);
       user.save();
      res.redirect("/");
    });
  } else {
    res.send("You are not logged in. Please, login to comment.");
  }
});





app.listen("4000",function(){
  console.log("server started on port 4000");
});
