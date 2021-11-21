const router=require('express').Router();
const User=require('../models/User');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const saltRounds=13;
const jwt_key=process.env.JWT_KEY;
const fs=require('fs');
const path=require('path');
const PrivateData=require('../models/PrivateData'); 

// configuring multer
const multer=require('multer');
const multerStorage=multer.memoryStorage();
const upload=multer(multerStorage);


// @type  GET
// @route /auth/test
// @desc  just for testing
// @access PUBLIC
router.get("/test",(req,res)=>{
    res.status(200).send("Test Success");
});

// @type  POST
// @route /auth/login
// @desc  for logging in user
// @access PUBLIC
router.post('/login',async (req,res)=>{
    const { password, email } = req.body; 
    if (!email || !password) {
      res.status(401).json({ success: false, error: "Invalid Details" });
      return;
    }
    let userMatch = await User.findOne({ email: email }).populate('channels','name _id');
    if (userMatch) {
      let submittedPass = password;
      let savedPass = userMatch.password;
      const comparePassword = bcrypt.compareSync(submittedPass, savedPass);
      if (comparePassword === true) {
        let timeInMinutes=45;
        let expires = Math.floor(Date.now() / 1000) + 60 * timeInMinutes;
        let token = jwt.sign(
          {
            name: userMatch.name,
            exp: expires,
          },
          jwt_key
        );
        res.status(200).send({
          success: true,
          data:{
              _id:userMatch._id,
              name:userMatch.name,
              email:userMatch.email,
              pic:userMatch.pic,
              channels:userMatch.channels,
              token:token,
              wallpaper:userMatch.wallpaper
          }
        });
      } else {
        res.status(401).send({
          success: false,
          error: "Invalid Password!",
        });
      }
    } else {
      res.status(401).send({
        success: false,
        error: "Invalid Credentials!",
      });
    }
});

// @type  POST
// @route /auth/signup
// @desc  to signup user
// @access PUBLIC
router.post('/signup',upload.any(),async (req,res)=>{
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
        res.status(401).json({ success: false, error: "Invalid Details" });
        return;
    } 
    let userMatch = await User.findOne({ email: email });
    if (userMatch) {
        res.status(401).send({
        success: false,
        error: "Email present!",
        });
    } else {
        const temp_password = await bcrypt.hash(password, saltRounds);
        let pic_name=`${name}_${Date.now()}.jpg`;
        let pic_present=false;

        if(req.files[0]){
            fs.writeFileSync(path.join(__dirname,"../public/userpics/",pic_name),req.files[0].buffer);
            pic_present=true;
        }else pic_name="avatar.jpg";

        const new_user = new User({
            name: name,
            email: email,
            password: temp_password,
            pic: pic_name,
        });
        new_user.save((err, user) => {
            if (err) {
                if(pic_present){
                  fs.unlinkSync(path.join(__dirname,"../public/userpics/",pic_name));
                }
                res.status(400).send({
                success: false,
                error: "Service Temporary Unavalable!",
                });
            }
            else {
              res.status(200).json({
                success:true
              });
            }
        });
    }
});

// @type  POST
// @route /auth/changeWallpaper
// @desc  to change user's wallpaper
// @access PUBLIC
router.post('/changeWallpaper',upload.any(),async (req,res)=>{
  let {_id}=req.body;
  if(!_id){
    res.status(404).json({
      success:false,
      error:"Invalid Details!"
    });
    return;
  }
  try{
    let user=await User.findById(_id);
    if(user.wallpaper!=="")
        fs.rmSync(path.join(__dirname,"../public/wallpaper/",user.wallpaper));
    if(req.files.length===0){
      user.wallpaper="";
    }else{
      let name=Date.now()+".jpg";
      fs.writeFileSync(path.join(__dirname,"../public/wallpaper/",name),req.files[0].buffer);
      user.wallpaper=name;
    }
    user.save().then(()=>res.status(200).json({
      success:true,
      data:user.wallpaper
    })).catch(err=>{
      console.log(err);
      res.status(401).json({
        success:false,
        error:"SERVER PROBLEM!"
      });
    });
  }catch(e){
    res.status(404).json({
      success:false,
      error:"Invalid User!"
    });
  }
});


// @type  POST
// @route /auth/updateProfile
// @desc  to update user's profile
// @access PUBLIC
router.post('/updateProfile',upload.any(),async (req,res)=>{
  let toUpdateName=false;
  let toUpdatePic=false;
  let noProfilePic=false;
  let {_id,name}=req.body;
  if(!_id){
    res.status(404).json({
      success:false,
      error:"Invalid Details!"
    });
    return;
  }
  if(name){
    toUpdateName=true;
  }
  if(req.files.length!==0){
    toUpdatePic=true;
  }
  try{
    let user=await User.findById(_id);
    if(user.pic==='avatar.jpg') noProfilePic=true;
    let oldPic=user.pic;
    let newPic=(name)?`${name}_${user._id}.jpg`:`${user.name}_${user._id}.jpg`;
    if(toUpdatePic){
      fs.writeFileSync(path.join(__dirname,"../public/userpics/",newPic),req.files[0].buffer);
      user.pic=newPic;
    }
    if(toUpdateName){
      user.name=name;
    }
    user.save().then((_user)=>{
      res.status(200).json({
        success:true,
        data:{
          name:_user.name,
          pic:_user.pic
        }
      });
      if(toUpdatePic && !noProfilePic)
        fs.rmSync(path.join(__dirname,"../public/userpics/",oldPic));
    }).catch(err=>{
      console.log(err);
      res.status(401).json({
        success:false,
        error:"SERVER PROBLEM!"
      });
    });
  }catch(err){
    res.status(404).json({
      success:false,
      error:"Invalid User!"
    });
  }
});


// @type  POST
// @route /auth/addFriend
// @desc  to add a friend
// @access PRIVATE
router.post('/addFriend',async (req,res)=>{
  let {id,friendId}=req.body;
  if(!id || !friendId){
    res.status(404).json({
      success:false,
      error:"Invalid Details!"
    });
    return;
  }
  PrivateData.create({
    messages:[]
  }).then(async privateData=>{
    try{
      let user1=await User.findById(id);
      let user2=await User.findById(friendId);
      user1.friends.push({
        friend:friendId,
        messages:privateData._id
      });
      user2.friends.push({
        friend:id,
        messages:privateData._id
      });
      await user1.save();
      await user2.save();
      res.status(200).json({
        success:true,
        data:{
          messagesId:privateData._id,
          name:user2.name,
          pic:user2.pic,
          id:user2._id
        }
      });
    }catch(e){
      console.log(e);
      res.status(401).json({
        success:false,
        error:"SERVER PROBLEM OR WRONG IDS!"
      });
    }
  }).catch(err=>{
      console.log(err);
      res.status(401).json({
        success:false,
        error:"SERVER PROBLEM!"
      });
  });
});

// @type  GET
// @route /auth/getAllUsers
// @desc  to get all users
// @access PUBLIC
router.get('/getAllUsers',async (req,res)=>{
  let {name}=req.query;
  if(!name){
    res.status(404).json({
      success:false,
      error:"NO SEARCH QUERY!"
    });
    return;
  } 
  const regex = new RegExp(name, 'i') // i for case insensitive
  try{
    let data=await User.find({name: {$regex: regex}}).select("_id name pic");
    res.status(200).json({
      success:true,
      data
    });
  }catch(e){
    console.log(e);
    res.status(401).json({
      success:false,
      error:"SERVER PROBLEM!"
    });
  }
});
module.exports=router;