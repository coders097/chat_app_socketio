const fs=require('fs'); 
const path = require('path');
const ChannelData=require('../models/ChannelData');
const User=require('../models/User');
const PrivateData=require('../models/PrivateData');

// Socket IO
var io = require(`socket.io`)(3200,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
});

let connectedClients={};
let mapIdToSocketId=new Map();
io.on('connection',socket=>{
    console.log(socket.id);
    connectedClients[socket.id]=socket;
    console.log("NEW CLIENT JOINED!");
    socket.emit('connection',"YOU ARE CONNECTED!");

    socket.on('linkIdToSocketId',(data)=>{
        let {id}=data;
        mapIdToSocketId.set(id,socket.id); 
    });

    socket.on('link-room',(data)=>{
        let {name,channelId,clientId}=data;
        if(channelId){
            // its already present
            User.findById(clientId).then(user=>{
                user.channels.push(channelId);
                user.save().then(()=>{
                    socket.emit('success',{
                        success:true,
                        data:{
                            name,
                            _id:channelId
                        }
                    });
                }).catch(err=>{
                    console.log(err);
                    socket.emit('problem',{
                        error:"SERVER PROBLEM!"
                    });
                });
            }).catch(err=>{
                console.log(err);
                socket.emit('problem',{
                    error:"SERVER PROBLEM!"
                });
            });
        }else{
            ChannelData.create({
                name:name
            }).then(data=>{
                User.findById(clientId).then(user=>{
                    user.channels.push(data._id);
                    user.save().then(()=>{
                        socket.emit('success',{
                            success:true,
                            data:{
                                name,
                                _id:data._id
                            }
                        });
                        socket.broadcast.emit("everyone-channel-added-now",{
                            data:{
                                name,
                                _id:data._id
                            }
                        });
                    }).catch(err=>{
                        console.log(err);
                        socket.emit('problem',{
                            error:"SERVER PROBLEM!"
                        });
                    });
                }).catch(err=>{
                    console.log(err);
                    socket.emit('problem',{
                        error:"SERVER PROBLEM!"
                    });
                });
            }).catch(err=>{
                console.log(err);
                socket.emit('problem',{
                    error:"SERVER PROBLEM!"
                });
            })
        }
    });

    socket.on('join-private-chat',(data)=>{
        let {privateChatBoxId,chatId}=data;
        PrivateData.findById(privateChatBoxId).populate('messages.sender','name pic _id').then(data=>{
            socket.emit('join-private-chat-result',{
                success:true,
                data:{
                    _id:privateChatBoxId,  
                    messages:data.messages
                }
            });
        }).catch(err=>{
            console.log(err);
            socket.emit('problem',{
                error:"SERVER PROBLEM!"
            });
        });
    });

    socket.on('join-room',(data)=>{
        let {id}=data;
        ChannelData.findById(id).populate('messages.sender','name pic _id').then(data=>{
            socket.join(data.name);
            socket.emit('join-room-result',{
                success:true,
                data:{
                    _id:id,
                    name:data.name,
                    messages:data.messages
                }
            });
        }).catch(err=>{
            console.log(err);
            socket.emit('problem',{
                error:"SERVER PROBLEM!"
            });
        });
    });

    // someone is typing
    socket.on('send-group-ping',(data)=>{
        let {name,groupId,groupName}=data;
        socket.in(groupName).emit('send-group-pinging',{
            name:name,
            id:groupId
        });
    });
    socket.on('send-private-ping',(data)=>{
        let {name,to,from}=data;
        let friendSocket=connectedClients[mapIdToSocketId.get(to)];
        if(friendSocket){
            console.log("done!");
            friendSocket.emit('send-group-pinging',{
                name:name,
                id:from
            });
        }
    });

    socket.on('send-message',(data)=>{
        let {sender,message,isChannel,to}=data;
        let payload={
            sender:to.id,
            message:{
                message,sender,_id:to.id
            }
        };
        if(isChannel){
            ChannelData.findById(to.id).then(data=>{
                data.messages.push({
                    message,sender:sender._id
                });
                data.save().then(()=>{
                    socket.in(to.name).emit('new-message',payload);
                    socket.emit('new-message',payload);
                }).catch(()=>{
                    socket.emit('problem',{
                        error:"MESSAGE SENT FAILED!"
                    });    
                });
            }).catch(err=>{
                socket.emit('problem',{
                    error:"MESSAGE SENT FAILED!"
                });
            });
        }else{
            // TODO : Handle Case of User sender,message,isChannel,to
            PrivateData.findById(to.messageId).then(data=>{
                data.messages.push({
                    message,sender:sender._id
                });
                data.save().then(()=>{
                    payload.sender=to.messageId;
                    socket.emit('new-message',payload);
                    let friendSocket=connectedClients[mapIdToSocketId.get(to.id)];
                    if(friendSocket){
                        friendSocket.emit('new-message',payload);
                    }else{
                        socket.emit('problem',{
                            error:"YOUR FRIEND WILL RECEIVE WHEN ONLINE:)"
                        });     
                    }
                }).catch(()=>{
                    socket.emit('problem',{
                        error:"MESSAGE SENT FAILED!"
                    });    
                });
            }).catch(err=>{
                socket.emit('problem',{
                    error:"MESSAGE SENT FAILED!"
                });
            });
        }
    });

    socket.on('disconnect',()=>{
        console.log("Disconnect Socket")
        if(connectedClients[socket.id])
            delete connectedClients[socket.id];
    });

});