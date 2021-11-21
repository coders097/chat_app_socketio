import React, { useContext, useEffect, useState } from "react";
import Chat from "../assets/chat.png";
import Group from "../assets/group.png";
import { AUTHCONTEXT, PRIVATECONTEXT } from "../App";

function Aside(props) {
  let {
    setPopUpView,
    setAllChannels,
    currentChannelId,
    setCurrentChannelId,
    setCurrentChannelName,
    privateChatMode,
    setPrivateChatMode,
    allFriends, 
    setAllFriends,
    setPrivateChatBoxId,
    allChannels,
    io
  } = props;
  let { authState, authDispatch } = useContext(AUTHCONTEXT);

  let loadAllChannels = () => {
    fetch("http://localhost:3100/fetch/allChannels")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) { 
          setAllChannels([...data.data]);
          localStorage.setItem("--allChannels",JSON.stringify(data.data));
          console.log(data.data);
        } else alert(data.error);
      })
      .catch((err) => alert(err));
  };


  // useEffect(()=>{
  //   io?.on("everyone-channel-added-now",(data)=>{
  //     // setAllChannels([...allChannels]);
  //   });
  // },[io]);

  let loadAllFriends = () => {
    fetch("http://localhost:3100/fetch/allFriends",{
        method:"POST",
        headers:{
            'Content-Type':"application/json"
        },
        body:JSON.stringify({
            id:authState._id
        })
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setAllFriends(data.data);
      } 
    })
    .catch((err) => alert(err));
  };

  useEffect(() => {
    setTimeout(()=>{
      loadAllChannels();
      loadAllFriends();
    },1000);
  }, []);

  return (
    <aside style={{ gridArea: "aside" }}>
      <div className="public-rooms">
        <h1>All Rooms</h1>
        <div className="_display">
          {authState.channels.map((channel) => {
            return (
              <div
                className={
                  channel._id === currentChannelId ? "item _active" : "item"
                }
                key={channel._id}
                onClick={() => {
                  setPrivateChatMode(false);
                  setCurrentChannelId(channel._id);
                  setCurrentChannelName(channel.name);
                }}
              >
                <p>#{channel.name}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="private-chats">
        <h1>All Private Chats</h1>
        <div className="_display">
            {allFriends.map((friend)=>{
                return <div 
                  className={
                    friend.id === currentChannelId ? "item _active" : "item"
                  } 
                  key={friend.id} 
                  onClick={()=>{
                    setPrivateChatMode(true);
                    setCurrentChannelId(friend.id);
                    // console.log(friend.messagesId);
                    setPrivateChatBoxId(friend.messagesId);
                }}>
                        <img alt="" src={`http://localhost:3100/fetch/getPic?name=${friend.pic}&userpic=true`} />
                        <p>{friend.name}</p>
                    </div>;
            })}
          
        </div>
      </div>
      <div className="add">
        <button
          onClick={() =>
            setPopUpView({
              view: true,
              profileEditView: false,
              chatAddView: true,
              roomAddView: false,
            })
          }
        >
          <img src={Chat} alt="" />
        </button>
        <button
          onClick={() =>
            setPopUpView({
              view: true,
              profileEditView: false,
              chatAddView: false,
              roomAddView: true,
            })
          }
        >
          <img src={Group} alt="" />
        </button>
      </div>
    </aside>
  );
}

export default Aside;
