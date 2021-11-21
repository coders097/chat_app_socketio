const express=require('express');
const server=express();
const cors=require('cors');
require('dotenv').config({path:"./config.env"});
const mongoose=require('mongoose');
const morgan=require('morgan');

// connecting to database
mongoose.connect(process.env.MONGO_URL,{useNewUrlParser:true,useUnifiedTopology:true});
const db=mongoose.connection;
db.on('error',()=>console.log("connection error"));
db.once('open',()=>{
    console.log("We are connected!");
});


// Middlewares
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({extended:false}));
server.use(morgan('dev')); 


server.get("/",(req,res)=>{
    res.send("Working!");
});


// configuring routes
const authRouter=require('./routes/auth');
server.use("/auth",authRouter);
const fetchRouter=require('./routes/fetch');
server.use("/fetch",fetchRouter);


// configuring socket.io
require('./socket/socketcommunication');


server.listen(3100,()=>{
    console.log("Started at http://localhost:3100");
});

