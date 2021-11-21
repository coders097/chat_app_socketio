import React, { createRef, useContext, useEffect, useState } from 'react';
import '../css/PopUpView.css';
import {AUTHCONTEXT, MESSAGESCONTEXT} from '../App';

function PopUpView(props) {

    let {popUpView,setPopUpView,io,allChannels,allFriends,setAllFriends}=props;
    let roomNameToCreate=createRef();
    let {authState,authDispatch}=useContext(AUTHCONTEXT);
    let {messageState,messageDispatch}=useContext(MESSAGESCONTEXT);

    let [roomSearchResults,setRoomSearchResults]=useState([]);
    let [dictOfChannels,setDictOfChannels]=useState(new Map());
    let [dictOfFriends,setDictOfFriends]=useState(new Map());
    let profilePic=createRef();
    let profilePicView=createRef();
    let profileName=createRef();
    let [userSearchResults,setUserSearchResults]=useState([]);


    useEffect(()=>{
        let map=new Map();
        authState.channels.forEach((channel,i)=>{
            map.set(channel._id,channel.name);
            if(i===authState.channels.length-1){
                setDictOfChannels(map);
            }
        });
    },[authState]);
    
    useEffect(()=>{
        let map=new Map();
        allFriends.forEach((channel,i)=>{
            map.set(channel.id,channel.name);
            if(i===allFriends.length-1){
                setDictOfFriends(map);
            }
        });
    },[allFriends]);

    useEffect(()=>{
        io?.on('success',data=>{
            console.log(data.data._id);
            localStorage.setItem('-user-details',JSON.stringify((function _(){
                let _data=JSON.parse(localStorage.getItem('-user-details'));
                if(_data){
                    _data.channels.push(data.data);
                    return _data;
                }else return null;
            }())));
            authDispatch({
                type:"ADD_ROOM",
                payload:data.data
            });
            messageDispatch({
                type:"ADD_MESSAGE_CONTAINER",
                payload:data.data._id
            });
            setTimeout(()=>{
                setPopUpView({
                    view:false,
                    profileEditView:false,
                    chatAddView:false,
                    roomAddView:false
                });
            },1200);
            
        });
    },[io]);

    const profileUpdate=()=>{
        if(profileName.current.value.trim()==="" && (profilePic.current.files.length===0)){
            alert("Nothing to Update!")
            return;
        }
        let form=new FormData();
        form.append('_id',authState._id);
        if(profileName.current.value.trim()!==""){
            form.append("name",profileName.current.value.trim());
        }
        if(profilePic.current.files.length!==0){
            form.append("pic",profilePic.current.files[0]);
        }
        fetch("http://localhost:3100/auth/updateProfile",{
            method:"POST",
            body:form
        }).then(res=>res.json())
        .then(data=>{
            if(data.success){
                localStorage.setItem('-user-details',JSON.stringify((function _(){
                    let _data=JSON.parse(localStorage.getItem('-user-details'));
                    if(_data){
                        _data.name=data.data.name
                        _data.pic=data.data.pic
                        return _data;
                    }else return null;
                }())));
                authDispatch({
                    type:"UPDATE_PROFILE",
                    payload:data.data
                });
            }else{
                alert(data.error);
            }
        }).catch(err=>alert(err));
    }

    return (
        <div className={popUpView.view?"pop-up-view":"pop-up-view pop-up-view-hidden"}> 
            {popUpView.profileEditView?<div className="update-view">
                <img src={`http://localhost:3100/fetch/getPic?name=${authState.pic}&userpic=true`} alt="" ref={profilePicView}/>
                <input type="file" style={{display:"none"}} ref={profilePic} accept="image/*" onChange={(e)=>{
                    if(e.target.files.length===0){
                        profilePicView.current.src=`http://localhost:3100/fetch/getPic?name=${authState.pic}&userpic=true`;
                    }else
                    profilePicView.current.src=URL.createObjectURL(e.target.files[0]);
                }}/>
                <input type="text" className="input _valid" placeholder="Name (Update if necessary)" ref={profileName}/>
                <div className="set">
                    <button className="btn" onClick={()=>profilePic.current.click()}>Update Profile Pic</button>
                    <button className="btn btn-danger" onClick={()=>profileUpdate()}>Update</button>
                </div>
            </div>:null}


            {popUpView.chatAddView?<div className="add-client-view">
                <input className="input _valid" type="text" placeholder="Enter client name" onChange={async (e)=>{
                    if(e.target.value===""){
                        setUserSearchResults([]);
                        return;
                    }
                    let data=await ((await fetch(`http://localhost:3100/auth/getAllUsers?name=${e.target.value}`)).json());
                    if(data.success){
                        setUserSearchResults(data.data);
                    }
                    else setUserSearchResults([]);
                }}/>
                <div className="clients">
                    {userSearchResults.length===0?<p>All Clients Appear here</p>:null}
                    {userSearchResults.map(user=>
                        (dictOfFriends.get(user._id) || (user._id===authState._id))?null:
                        <div className="_room" key={user._id}>
                            <img src={`http://localhost:3100/fetch/getPic?name=${user.pic}&userpic=true`}/>
                            <p>{user.name}</p>
                            <span onClick={async ()=>{
                                let data=(await (await fetch('http://localhost:3100/auth/addFriend',{
                                    method:"POST",
                                    headers:{
                                        'Content-Type':"application/json"
                                    },
                                    body:JSON.stringify({
                                        id:authState._id,
                                        friendId:user._id
                                    })
                                })).json());
                                if(data.success){
                                    setAllFriends([
                                        ...allFriends,
                                        data.data
                                    ]);
                                    setTimeout(()=>{
                                        setPopUpView({
                                            view:false,
                                            profileEditView:false,
                                            chatAddView:false,
                                            roomAddView:false
                                        });
                                    },500);
                                }else{
                                    alert(data.error);
                                }
                            }}><i className="fa fa-plus" aria-hidden="true"></i></span>
                        </div>)}
                </div>
            </div>:null}


            {popUpView.roomAddView?<div className="add-room-view">
                <div className="set">
                    <input accept="image/*" className="input _valid" type="text" placeholder="Enter new group's name" ref={roomNameToCreate}/>
                    <button className="btn _valid" onClick={()=>{
                        if(roomNameToCreate.current.value.trim().length===0){
                            alert("What's the room name!");
                            return;
                        }
                        // name,channelId,clientId
                        io.emit('link-room',{
                            name:roomNameToCreate.current.value,
                            clientId:authState._id
                        });
                    }}>Create</button>
                </div>
                <span></span>
                <input className="input _valid" type="text" placeholder="Enter Room name"
                onChange={(e)=>{
                    if(e.target.value.trim()===''){
                        setRoomSearchResults([]);
                        return;
                    }
                    let data=allChannels.filter(channel=>{
                        if(dictOfChannels.has(channel._id)) return false;
                        if(channel.name.toLowerCase().includes(e.target.value.toLowerCase())) return true;
                    });
                    setRoomSearchResults(data);
                }}/>
                <div className="clients">
                    {roomSearchResults.length===0?<p>Search Rooms Appear here</p>:null}
                    {roomSearchResults.map(room=>
                        <div className="_room" key={room._id}>
                            <p>{room.name}</p>
                            <span onClick={()=>{
                                io.emit('link-room',{
                                    name:room.name,
                                    clientId:authState._id,
                                    channelId:room._id
                                });
                                // console.log(room._id);
                            }}><i className="fa fa-plus" aria-hidden="true"></i></span>
                        </div>)}
                </div>
            </div>:null}
            <p onClick={()=>setPopUpView({
                view:false,
                profileEditView:false,
                chatAddView:false,
                roomAddView:false
            })}><i class="fa fa-times" aria-hidden="true"></i></p>
        </div>
    );
}

export default PopUpView;