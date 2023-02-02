const express = require('express');
const session= require('express-session')
const ejsMate = require('ejs-mate');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./model/user')


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


app.use(session({secret:'notagoodsecret'}))


const requireLogin =  (req,res,next)=>{
    if(!req.session.user_id){
        return res.redirect('/error')
    }
    next();
}


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

app.post('/logout',(req,res)=>{
    req.session.user_id=null;
    req.session.destroy();
    res.redirect('/login')
})

app.get('/buy',requireLogin,(req,res)=>{
    res.render('buy')
})

app.get('error',(req,res)=>{
    res.render('error')
})


const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})