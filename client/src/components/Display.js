import React, { createRef, useContext, useEffect, useState } from 'react';
import { AUTHCONTEXT, MESSAGESCONTEXT } from '../App';

function Display(props) {
    // {
    //     message:{
    //         content:String,
    //         time:Date,
    //         attach:String
    //     },
    //     sender:{
    //         type:Schema.Types.ObjectId
    // _id,name,pic
    //     }
    // }

    let {messageState,messageDispatch}=useContext(MESSAGESCONTEXT);
    let {authState}=useContext(AUTHCONTEXT);
    let {io,currentChannelId,currentChannelName,someoneWriting,privateChatMode,privateChatBoxId} = props;
    let inputField=createRef();
    let messageView=createRef();
    let fileMessageInput=createRef();

    useEffect(()=>{
        if(!messageState[privateChatBoxId] || !messageState[privateChatBoxId].loaded){
            if(privateChatMode)
                io?.emit('join-private-chat',{
                    privateChatBoxId:privateChatBoxId,
                    chatId:currentChannelId
                });
        }
    },[currentChannelId,io]);

    useEffect(()=>{
        messageView.current.scrollTop=messageView.current.scrollHeight;
    },[someoneWriting.writersName]);

    useEffect(()=>{
        if(messageState[currentChannelId] && !messageState[currentChannelId].loaded){
            if(!privateChatMode)
                io?.emit('join-room',{
                    id:currentChannelId
                });
        }
    },[currentChannelId,io]);

    
    useEffect(()=>{
        messageView.current.scrollTop=messageView.current.scrollHeight;
    },[messageState]);

    useEffect(()=>{
        io?.on('join-room-result',(data)=>{
            // success:true,
            //     data:{
                //     _id
            //         name:data.name,
            //         messages:data.messages
            //     }
            let allMessages=messageState[data.data._id]?messageState[data.data._id]['messages']:[];
            allMessages.push(...data.data.messages);
            messageDispatch({
                type:'LOAD_MESSAGES',
                payload:{
                    _id:data.data._id,
                    messages:allMessages
                }
            });
        });
        // handle case of join-private-chat-result
        io?.on('join-private-chat-result',(data)=>{
            // {
            //     success:true,
            //     data:{
            //         _id:data._id,
            //         messages:data.messages
            //     }
            // }
            let allMessages=messageState[data.data._id]?messageState[data.data._id]['messages']:[];
            allMessages.push(...data.data.messages);
            // console.log("EARLIER ",data.data._id);
            messageDispatch({
                type:'LOAD_MESSAGES',
                payload:{
                    _id:data.data._id,
                    messages:allMessages
                }
            });
        });
    },[io]);

    // Send Message
    let sendButton=createRef();

    let activateMessageButton=(check)=>{
        // de-active 
        document.getElementById('finalbtn').className=(check)?"btn btn-danger":"btn btn-danger de-active";
        document.getElementById('finalbtn').innerHTML=(check)?"POST":'<i class="fa fa-spin fa-circle-o-notch" aria-hidden="true"></i>';
    }

    let sendMessage=async ()=>{
        activateMessageButton(false);
        let file=fileMessageInput.current.files[0];
        if(inputField.current.value.trim()==='' && !file){
            alert("Nothing To Send!");
            activateMessageButton(true);
            return;
        }
        let attachmentName="";
        if(file){
            let formData=new FormData();
            formData.append('file',file);
            formData.append('_id',authState._id);
            let result=(await (await fetch('http://localhost:3100/fetch/addFile',{
                method:"POST",
                body:formData
            })).json());
            activateMessageButton(true);
            if(result.success){
                attachmentName=result.name;
            }else{
                alert(result.error);
                attachmentName="";
                return;
            }
        }
        if(file && attachmentName==='') return;

        let payload={
            sender:{
                _id:authState._id,
                name:authState.name,
                pic:authState.pic
            },
            message:{
                content:inputField.current.value.trim(),
                time:Date.now(),
                attach:attachmentName
            },
            isChannel:(privateChatMode)?false:true,
            to:{
                id:currentChannelId,
                name:(privateChatMode)?"":currentChannelName,
                messageId:privateChatBoxId
            }
        };
        io?.emit("send-message",payload);
        setTimeout(()=>{
            activateMessageButton(true);
            document.getElementById('fileToMessage').value="";
        },800);
    }

    let componentGeneratorFromAttachment=(name)=>{
        if(name==="") return null;
        let index=name.lastIndexOf(".");
        if(index===-1) return null;
        let ext=name.substring(index);
        if(ext==='.jpg' || ext==='.jpeg' || ext==='.png' || ext==='.webp' || ext==='.gif'){
            return <img src={`http://localhost:3100/fetch/getPic?name=${name}`} alt="user-post-pic"/>;    
        }else if(ext==='.mp4' || ext==='.webm' || ext==='.flv'){
            return <video src={`http://localhost:3100/fetch/getVideo?name=${name}`} onClick={(e)=>{
                if(e.target.paused) e.target.play();
                else e.target.pause();
            }}/>;
        }else if(ext==='.mp3' || ext==='.wav' || ext==='.mpeg'){
            return <audio src={`http://localhost:3100/fetch/getAudio?name=${name}`} controls={true}/>;
        }
        return null;
    }

    return (
        <main style={{gridArea:"display"}} style={{
            backgroundImage: `url(${authState.wallpaper===""?"":`http://localhost:3100/fetch/getPic?wallpaper=${authState.wallpaper}`})`
        }}>
            <div className="messages-view" ref={messageView}>
                {messageState[(privateChatMode)?privateChatBoxId:currentChannelId]?.messages.map((message,i)=>{
                    return <div className={message.sender._id===authState._id?"message _right":"message"} key={i}>
                        <img className="profile-sender" src={`http://localhost:3100/fetch/getPic?name=${message.sender.pic}&userpic=true`} alt="sender_pic" title={message.sender.name}/>
                        <div className="_body" data-sendtime={new Date(message.message.time).toLocaleString('en-US',{hour12:true})}>
                            {componentGeneratorFromAttachment(message.message.attach)} 
                            <p>{message.message.content}</p>
                        </div>
                    </div>;
                })}
                {someoneWriting.isIt && currentChannelId===someoneWriting.channelId?<div className="someone-writing">
                    <p>{someoneWriting.writersName} is writing something!</p>
                </div>:null}
                
            </div>
            <div className="message-input">
                <textarea className="input _valid" ref={inputField} onChange={(e)=>{
                    if(e.target.value==='') return;
                    if(!privateChatMode)
                        io.emit('send-group-ping',{
                            name:authState.name,
                            groupId:currentChannelId,
                            groupName:currentChannelName
                        });
                    else {
                        io.emit('send-private-ping',{
                            name:authState.name,
                            to:currentChannelId,
                            from:authState._id
                        });
                    }
                }}/>
                <div className="_controls">
                    <input id="fileToMessage" type="file" ref={fileMessageInput} style={{display:"none"}} accept=".mp4,.jpg,.jpeg,.png,.webp,.webm,.flv,.gif,.wav,.mp3"/>
                    <button className="btn" onClick={()=>fileMessageInput.current.click()}>ATTACH</button>
                    <button id="finalbtn" ref={sendButton} className="btn btn-danger" onClick={()=>sendMessage()}>POST</button>
                </div>
            </div>
        </main>
    );
}

export default Display;