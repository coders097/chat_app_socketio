const mongoose=require('mongoose');
const Schema=mongoose.Schema;
 
const UserSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    pic:{
        type:String,
        default:"avatar.jpg"
    },
    channels:[{
        type:Schema.Types.ObjectId,
        ref:"channeldata"
    }],
    wallpaper:{
        type:String,
        default:""
    },
    friends:[
        {
            friend:{
                type:Schema.Types.ObjectId,
                ref:"user"
            },
            messages:{
                type:Schema.Types.ObjectId,
                ref:"privatedata"
            }
        }
    ]
});


module.exports=User=mongoose.model("user",UserSchema);