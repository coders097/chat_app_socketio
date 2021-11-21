const router=require('express').Router();
const fs=require('fs');
const path=require('path');
const jwtVerify=require('../middlewares/jwtAuthentication').jwtCheckToken;
const ChannelData=require('../models/ChannelData');
const User=require('../models/User');

// configuring multer
const multer=require('multer');
const multerStorage=multer.memoryStorage();
const upload=multer(multerStorage);

// @type  GET
// @route /fetch/getPic
// @desc  for getting pic 
// @access PUBLIC
router.get("/getPic",async (req,res)=>{
    let {name,userpic,wallpaper}=req.query;
    if(wallpaper){
        try{
            let stream=fs.createReadStream(path.join(__dirname,"../public/wallpaper/",wallpaper));
            res.setHeader("Content-Type","image/*");
            stream.pipe(res);
            return;
        }catch(e){
            res.status(404).send();
        }
    }
    if(!name){
        res.status(404).send();
        return;
    }
    try{
        let stream=(userpic)?fs.createReadStream(path.join(__dirname,"../public/userpics/",name)):
                    fs.createReadStream(path.join(__dirname,"../public/temp/",name));
        res.setHeader("Content-Type","image/*");
        stream.pipe(res);
    }catch(e){
        res.status(404).send();
    }
}); 


// @type  GET
// @route /fetch/getAudio
// @desc  for getting audio 
// @access PUBLIC
router.get("/getAudio",async (req,res)=>{
    let {name}=req.query;
    if(!name){
        res.status(404).send();
        return;
    }
    try{
        let stream=fs.createReadStream(path.join(__dirname,"../public/temp/",name));
        res.setHeader("Content-Type","audio/*");
        stream.pipe(res);
    }catch(e){
        res.status(404).send();
    }
});


// @type  GET
// @route /fetch/getVideo
// @desc  for getting video 
// @access PUBLIC
// @support streaming
router.get("/getVideo",async (req,res)=>{
    let {name}=req.query;
    if(!name){
        res.status(404).send();
        return;
    }
    const range=req.headers.range;
    // bytes=0-
    const videoPath=path.join(__dirname,"../public/temp/",name);
    try{
        const videoSize=fs.statSync(videoPath).size

        const chunkSize = 500000;  // 500KB
        const start=parseInt(range?range.replace("bytes=",""):300000);  
        const end=Math.min(start+chunkSize,videoSize-1);
        const contentLength=end-start+1;

        const headers={
            "Content-Range":`bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges":"bytes",
            "Content-Length":contentLength,
            "Content-Type":"video/*"
        }

        res.writeHead(206,headers);

        const stream=fs.createReadStream(videoPath,{start,end})
        stream.pipe(res);
    }catch(e){
        res.status(404).send();
    }
});

// @type  POST
// @route /fetch/addFile
// @desc  for adding a file 
// @access PRIVATE
router.post('/addFile',upload.any(),async (req,res)=>{
    if(req.files.length==0 || !req.body._id){
        res.status(401).json({
            success:false,
            error:"ADD File To Send!"
        });
        return;
    }
    let name=`${req.body._id}_${Date.now()}`;
    let [type,ext]=req.files[0].mimetype.split('/');
    if(type==='image' || type==='audio' || type==='video'){
        name+=`.${ext}`;
    }
    console.log(name);
    try{
        fs.writeFileSync(path.join(__dirname,"../public/temp/",name),req.files[0].buffer);
        res.status(200).json({
            success:true,
            name
        });
    }catch(e){
        res.status(401).json({
            success:false,
            error:"Server Problem!"
        });
        return;
    }
});

// @type  GET
// @route /fetch/allChannels
// @desc  for getting all channels
// @access PUBLIC
router.get("/allChannels",(req,res)=>{
    ChannelData.find().select('-messages -__v').then(channels=>{
        res.status(200).json({
            success:true,
            data:channels
        });
    }).catch(err=>{
        console.log(err); 
        res.status(401).json({
            success:false,
            error:"Server Problem!"
        });
    });
});

// @type  POST
// @route /fetch/allFriends
// @desc  for getting all friends
// @access PUBLIC
router.post("/allFriends",async (req,res)=>{
    let {id}=req.body;
    if(!id){
        res.status(404).json({
            success:false,
            error:"Invalid Details!"
        });
        return;
    }
    try{
        let user=await User.findById(id).populate('friends.friend',"_id name pic");
        res.status(200).json({
            success:true,
            data:user.friends.map(data=>{
                return {
                    messagesId:data.messages,
                    name:data.friend.name,
                    pic:data.friend.pic,
                    id:data.friend._id
                };
            })
        });
    }catch(err){
        console.log(err);
        res.status(401).json({
            success:false,
            error:"Server Problem!"
        });
    }
});
module.exports=router;