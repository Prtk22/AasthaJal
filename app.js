const week = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var currTime = new Date();
var thismonth = currTime.getMonth();
var thisyear = currTime.getFullYear(); 
var todaysdate = currTime.getDate();

function getDaysInMonth(month, year) {
    var date = new Date(year, month, 1);
    var days = [];
    while (date.getMonth() === month) {
      days.push(week[new Date(date).getDay()]);
      date.setDate(date.getDate() + 1);
    }
    return days;
};

function pattern(){
    var res=[];
    var order=getDaysInMonth(thismonth,thisyear);
for(var i=0;i<order.length;i++)
{
     res.push(i+1+"/"+(thismonth+1)+"   "+order[i]);
}
return res;
}




const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "This is our little secret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/aasthaDB");

const monthlySchema = new mongoose.Schema({
    username: String,
    password: String
});

const itemSchema = new mongoose.Schema({
    name : String
});

const instantItemSchema = new mongoose.Schema({
    date: String,
    quantity: Number
});

const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    address: String,
    order: [itemSchema],
    rec : [itemSchema]
});

const iuserSchema = new mongoose.Schema({
    email: String,
    name: String,
    address: String,
    order: [instantItemSchema]
});

monthlySchema.plugin(passportLocalMongoose);

const Month = mongoose.model("Month", monthlySchema);
const Instant = mongoose.model("Instant", monthlySchema);
const Muser = mongoose.model("Muser", userSchema);
const Iuser = mongoose.model("Iuser", iuserSchema);
const Item = mongoose.model("Item", itemSchema);
const authInstant = mongoose.model("authInstant", itemSchema);
const Order = mongoose.model("Order", instantItemSchema);

const myLocalStrategy1=Month.createStrategy();
const myLocalStrategy2=Instant.createStrategy();
passport.use('local.one', myLocalStrategy1);
passport.use('local.two', myLocalStrategy2);
passport.serializeUser(Month.serializeUser());
passport.deserializeUser(Month.deserializeUser());
passport.serializeUser(Instant.serializeUser());
passport.deserializeUser(Instant.deserializeUser());

function reset(){
    
    Muser.updateMany({}, {$set:{rec:[]}},function(err, success){
          if(err){
              console.log(err);
          }else{
              console.log(success);
          }
      });
  
    var temp = pattern();
    var final = [];
    for(var i=0;i<temp.length;i++){
        const it = new Item({
            name: temp[i]
        });
        final.push(it);
    }
    Muser.updateMany({}, {$set:{order:final}},function(err, success){
          if(err){
              console.log(err);
          }else{
              console.log(success);
          }
      });
  
    console.log('reset');
  }
  
  if(todaysdate===1)
  {

    reset();
  }



app.get("/", function(req, res){
    res.render("welcome");
});

app.get("/subscribe/:id", function(req, res){
    if(req.isAuthenticated()){
    res.render("subscribe", {subsroot:"/subscribe/"+req.params.id});
    }else{
        res.redirect("/");
    }
});

app.get("/monthly/:id", function(req, res){
    if(req.isAuthenticated()){
        Muser.findOne({email: req.params.id}, function(err, foundMuser){
            if(!err){
                if(foundMuser){
                    res.render("monthly", {name: foundMuser.name, address: foundMuser.address, undeli: foundMuser.order, monthroot: "/delivered/"+req.params.id, deli: foundMuser.rec, unroot:"/unsubscribe/"+req.params.id});
                }else{
                    res.render("subscribe", {subsroot:"/subscribe/"+req.params.id});
                }
            }else{
                console.log(err);
            }
        });
        
    }else{
        res.redirect("/");
    }
});

app.get('/logout', function (req, res){
    req.session.destroy(function (err) {
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.get("/unsubscribe/:id", function(req, res){
    Muser.deleteOne({email: req.params.id}, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/monthly/"+req.params.id);
        }
    });
});

app.get("/delete/subscribe/:id", function(req, res){
    Month.deleteOne({username: req.params.id}, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    }); 
})

app.post("/delivered/:id", function(req, res){
    var table = req.body.name;

    const newItem = new Item({
        name: table
    })

   
    Muser.updateOne({email: req.params.id}, {$push: {rec: newItem}}, function(err, success){
        if(err){
            console.log(err);
        }else{
            console.log(success);
        }
    });
    

    Muser.findOneAndUpdate({email: req.params.id}, {$pull: {order : {name : table}}}, function(err, doc){
        if(!err){
          console.log(doc);  
          res.redirect("/monthly/"+req.params.id);
        }
      });
});

app.post("/subscribe/:id", function(req, res){
    console.log("in this route");

    var temp = pattern();
    var final = [];
    for(var i=0;i<temp.length;i++){
        const it = new Item({
            name: temp[i]
        });
        final.push(it);
    }
    
    const newMuser = new Muser({
        email: req.params.id,
        name: req.body.name,
        address: req.body.address,
        order: final,
        rec: []
    });
    newMuser.save();
    //console.log(newMuser.order);
    res.redirect("/monthly/"+newMuser.email);
});


app.post("/login/:id", function(req, res){
    var name = req.params.id;

    if(name==="msignup"){
        res.render("login", {login: "Signup",root: "/setup/msignup", err:""});
    }else if(name==="mlogin"){
        res.render("login", {login: "Login", root: "/setup/mlogin", err:""});
    }else if(name==="isignup"){
        res.render("login", {login: "Signup", root: "/setup/isignup", err:""});
    }else if(name==="ilogin"){
        res.render("login", {login: "Login", root: "/setup/ilogin",err:""});
    }
});

app.post("/setup/msignup", function(req, res){
    Month.register({username: req.body.username}, req.body.password, function(err, newMonth){
        
        if(err){
            console.log(err);
            res.redirect("/err/msignup");
        }else{
            passport.authenticate("local.one")(req, res, function(){
                res.redirect("/subscribe/"+req.body.username);
            });
        }
    });
});

app.post("/setup/mlogin", function(req, res){
    const month = new Month({
        username: req.body.username,
        password: req.body.password
    });

    req.login(month, function(err){
        if(err){
            console.log(err);
            res.redirect("/");
        }else{
            passport.authenticate("local.one",{failureRedirect: "/err/mlogin"})(req, res, function(){
                console.log("Success logged in monthly");
                res.redirect("/monthly/"+month.username);
            });
        }
    })
});

app.post("/setup/isignup", function(req, res){
    Instant.register({username: req.body.username}, req.body.password, function(err, newInstant){
        
        if(err){
            console.log(err);
            res.redirect("/err/isignup")
        }else{
            passport.authenticate("local.two")(req, res, function(){
                console.log("Success sign up instant");
                const login = new authInstant({
                    name: req.body.username
                });
                login.save();
                res.redirect("/instant/"+req.body.username);
            });
        }
    });
});

app.post("/setup/ilogin", function(req, res){
    const instant = new Instant({
        username: req.body.username,
        password: req.body.password
    });

    req.login(instant, function(err){
        if(err){
            console.log(err);
        
        }else{
            passport.authenticate("local.two",{failureRedirect: "/err/ilogin"})(req, res, function(){
                const login = new authInstant({
                    name: req.body.username
                });
                login.save();
                console.log("Success logged in instant");
                res.redirect("/instant/"+req.body.username);
            });
        }
    })
});

//login error handling
app.get("/err/msignup",function(req,res){
    res.render("login",{login:"SIGN UP",root:"/setup/msignup",err:"USERNAME ALREADY EXISTS"});
});
app.get("/err/mlogin",function(req,res){
      res.render("login",{login:"LOG IN",root:"/setup/mlogin",err:"INVALID USERNAME OR PASSWORD"});
});
app.get("/err/isignup",function(req,res){
      res.render("login",{login:"SIGN UP",root:"/setup/isignup",err:"USERNAME ALREADY EXISTS"});
});
app.get("/err/ilogin",function(req,res){
      res.render("login",{login:"LOG IN",root:"/setup/ilogin",err:"INVALID USERNAME OR PASSWORD"});
});

/*INSTANT ORDER PAGES
*/



app.get("/instant/:id",function(req,res){

        authInstant.findOne({name:req.params.id},function(err,found){
          if(!err)
          {
            if(found)
            {
              Iuser.findOne({email:req.params.id},function(err,foundiuser){
                if(!err)
                {
                  if(foundiuser)
                  {
                     res.render("instant",{wel:"Welcome Back!",name:foundiuser.name,address:foundiuser.address, id:req.params.id});
                  }
                  else {
                    res.render("instant",{wel:"Welcome",name:"",address:"", id:req.params.id});
                  }
                }
                else {
                  console.log(err);
                }
              });
            }
            else {
              res.redirect("/");
            }
          }
          else {
            res.redirect("/");
          }
        });
});

app.post("/instant/:id", function(req, res){
    res.redirect("/instant/"+req.params.id);
})


var stringdate=todaysdate+"/"+(thismonth+1)+"/"+thisyear;
app.post("/iorder/:id", function(req, res){
    Iuser.findOne({email: req.params.id}, function(err, foundIuser){
        if(!err){
            if(foundIuser){
                const newOrder = new Order({
                    date: stringdate,
                    quantity: req.body.quantity
                });
                Iuser.updateOne({email: req.params.id}, {$push: {order: newOrder}}, function(err, success){
                    if(err){
                        console.log(err);
                    }else{
                        console.log(success);
                    }
                });
            }else{
                const newOrder = new Order({
                    date: stringdate,
                    quantity: req.body.quantity
                });
                const newiuser = new Iuser({
                    email: req.params.id,
                    name: req.body.name,
                    address: req.body.address,
                    order: [newOrder]
                });
                newiuser.save();
                
            }

            res.render("success", {id:req.params.id});
        }else{
            console.log(err);
        }
    });
});

app.get("/previous/:id", function(req, res){
    Iuser.findOne({email: req.params.id}, function(err, found){
        if(!err){
            if(found){
                res.render("previous",{name: found.name, address: found.address, undeli: found.order, id:req.params.id});
            }else{
                res.redirect("/noprevious/"+req.params.id);
            }
        }else{
            console.log(err);
        }
    });
});

app.get("/noprevious/:id", function(req, res){
    res.render("noprevious", {id: req.params.id});
})


function logoutall(){
    authInstant.deleteMany({},function(err){
      if(err)
      {
        console.log(err);
      }
      else {
        console.log("All logged Out");
      }
    });
  };
logoutall();

app.post("/instant/logout/:id", function(req, res){
    req.logout();
    authInstant.deleteMany({name: req.params.id}, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
});

app.get("/idelete/:id", function(req, res){
    Iuser.deleteOne({username: req.params.id}, function(err){
        if(err){
            console.log(err);
        }else{
            console.log("success");
        }
    }); 
    Instant.deleteOne({username: req.params.id}, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    }); 
    
});

app.listen(3000, function(){
    console.log("Server is running at port 3000");
});
