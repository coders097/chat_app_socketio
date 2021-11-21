const mongoose=require('mongoose');
const Schema=mongoose.Schema;
  
const ChannelDataSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    messages:[
        {
            message:{
                content:String,
                time:Date, 
                attach:String
            },
            sender:{
                type:Schema.Types.ObjectId,
                ref:"user"
            }
        }
    ] 
});


module.exports=ChannelData=mongoose.model("channeldata",ChannelDataSchema);