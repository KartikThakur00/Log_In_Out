const express = require('express');
const session= require('express-session')
const ejsMate = require('ejs-mate');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./model/user')
const MongoDBStore= require("connect-mongo")(session);



const dbUrl = "mongodb+srv://admin:grjtcDUO9NbS1uDq@cluster0.88q8xcj.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(dbUrl,{
     useNewUrlParser:true,
     //useCreateIndex:true,
     useUnifiedTopology:true,
});

mongoose.connection.on("error",console.error.bind(console, "connection error:"));
mongoose.connection.once('open',()=>{
    console.log("database connected");
})

const app = express();


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const secret = process.env.SECRET || 'thisshouldbebettersecret!';
const store = new MongoDBStore({
    url:dbUrl,
    secret,
    touchAfter:24*60*60
})

store.on("error",function(e){
    console.log('SESSION STORE ERROR', e)
})

const sessionConfig={
    store,
    name:'session',
    secret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        // secure:true,
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7
    }
}
app.use(session(sessionConfig));



const requireLogin =  (req,res,next)=>{
    if(!req.session.user_id){
        return res.redirect('/error')
    }
    next();
}

app.use((req,res,next)=>{
    res.locals.currentUser= req.session.username;
    console.log(res.locals.currentUser);
   next();
})


app.get('/', (req, res) => {
    res.render('home')
})

app.get("/login", (req, res) => {
    res.render('login')
})


app.post("/login", async(req, res) => {
    console.log(req.body);
    const {username,password}=req.body;
    const foundUser = await User.findOne({username})
    if(foundUser.password=password){
        req.session.user_id = foundUser._id;
        req.session.username = foundUser.username;
        res.redirect('/buy')

    }
    else{
        res.redirect('/login')
    }
})

app.get("/contact", (req, res) => {
    res.render('contact')
})

app.get("/register", (req, res) => {
    res.render('register')
})

app.post("/register", (req, res) => {
    console.log(req.body);
    const {username,password}=req.body;
    const user = new User({ username:username, password:password });

        user.save((err, doc) => {
            if (!err){
                req.session.user_id = user._id;
                res.redirect('/');
            }
               
            else
                console.log('Error during record insertion : ' + err);
      });
})

app.get('/logout',(req,res)=>{
    req.session.user_id=null;
    req.session.destroy();
    res.redirect('/login')
})

app.get('/buy',requireLogin,(req,res)=>{
    res.render('buy')
})

app.get('/error',(req,res)=>{
    res.render('error')
})


const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})