const mongoose=require('mongoose');
const Schema=mongoose.Schema;
  
const PrivateDataSchema=new Schema({
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


module.exports=PrivateData=mongoose.model("privatedata",PrivateDataSchema);