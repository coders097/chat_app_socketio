import React, { useContext, useEffect, useState } from "react";
import Navbar from "./Navbar";
import Aside from "./Aside";
import Display from "./Display";
import PopUpView from "./PopUpView";
import { AUTHCONTEXT, MESSAGESCONTEXT } from "../App";
import { useHistory } from "react-router-dom";
import Aud from "../assets/alert.mp3";
import SearchView from "./SearchView";

function Main(props) {
  let { io } = props;

  let [popUpView, setPopUpView] = useState({
    view: false,
    profileEditView: false,
    chatAddView: false,
    roomAddView: false,
  });

  let [allChannels, setAllChannels] = useState([]);
  let [allFriends, setAllFriends] = useState([]);
  let [privateChatMode, setPrivateChatMode] = useState(false);
  let [privateChatBoxId, setPrivateChatBoxId] = useState("");

  // the main function to messaging
  let [currentChannelId, setCurrentChannelId] = useState("");
  let [currentChannelName, setCurrentChannelName] = useState("");
  let [someoneWriting, setSomeoneWriting] = useState({
    isIt: false,
    writersName: "",
    channelId: "",
  });

  // Search feature
  let [searchView, showSearchView] = useState(false);
  let [searchResults, setSearchResults] = useState({
    groups: [],
    friends: []
  });
  let searchFunction = (e) => {
    // complete search function : TODO
    let query=e.target.value;
    if(query.trim()===""){
      setSearchResults({
        groups:[],
        friends:[]
      });
      return;  
    }
    let friends=[];
    let groups=[];
    friends=allFriends.filter((friend)=>{
      return friend.name.toLowerCase().includes(query.trim().toLowerCase());
    });
    groups=authState.channels.filter((channel)=>{
      return channel.name.toLowerCase().includes(query.trim().toLowerCase());
    });
    setSearchResults({
      groups,
      friends
    });
  };

  // useEffect(()=>{
  //   console.log(privateChatBoxId);
  // },[privateChatBoxId]);

  let { messageDispatch, messageState } = useContext(MESSAGESCONTEXT);
  let audio = new Audio();
  audio.src = Aud;

  // useEffect(()=>{
  //   console.log(messageState);
  // },[messageState]);

  useEffect(() => {
    io?.on("connection", (data) => {
      console.log(data);
    });
    io?.on("problem", (data) => {
      alert(data.error);
    });
    io?.on("new-message", (data) => {
      let { message, sender } = data;
      audio.play();
      setSomeoneWriting({
        isIt: false,
        writersName: "",
        channelId: "",
      });
      // console.log("NOW ", sender);
      // console.log(localStorage);

      if(!messageState[sender]){
        messageState[sender]={
          loaded:false,
          messages:[]
      };
      }
      messageState[sender]['messages'].push(message);
      messageDispatch({
        type: "ADD_MESSAGE",
        payload: {
          _id: sender,
          message,
          _ifnotpresentmessages: "",
        },
      });
    });
    io?.on("send-group-pinging", (data) => {
      // console.log("Private pinging ", data.id);
      setSomeoneWriting({
        isIt: true,
        writersName: data.name,
        channelId: data.id,
      });
    });
    return () => {
      io?.disconnect();
    };
  }, [io]);

  let { authState, authDispatch } = useContext(AUTHCONTEXT);
  let history = useHistory();

  useEffect(() => {
    if (authState.token.length === 0) {
      history.push("/");
      return;
    }
  }, [authState]);

  return (
    <section
      className="Talkin"
      style={{
        height: "100vh",
        width: "100%",
        display: "grid",
        gridTemplateRows: "90px calc(100vh - 90px)",
        gridTemplateColumns: "400px calc(100vw - 400px)",
        gridTemplateAreas: `"nav nav"
                                "aside display"`,
      }}
    >
      <Navbar
        io={io}
        setPopUpView={setPopUpView}
        showSearchView={showSearchView}
        searchFunction={searchFunction}
      />
      <Aside
        io={io}
        setPopUpView={setPopUpView}
        allChannels={allChannels}
        setAllChannels={setAllChannels}
        currentChannelId={currentChannelId}
        setCurrentChannelId={setCurrentChannelId}
        setCurrentChannelName={setCurrentChannelName}
        privateChatMode={privateChatMode}
        setPrivateChatMode={setPrivateChatMode}
        allFriends={allFriends}
        setAllFriends={setAllFriends}
        setPrivateChatBoxId={setPrivateChatBoxId}
      />
      <Display
        io={io}
        currentChannelId={currentChannelId}
        currentChannelName={currentChannelName}
        someoneWriting={someoneWriting}
        privateChatMode={privateChatMode}
        privateChatBoxId={privateChatBoxId}
      />
      <PopUpView
        popUpView={popUpView}
        setPopUpView={setPopUpView}
        io={io}
        allChannels={allChannels}
        allFriends={allFriends}
        setAllFriends={setAllFriends}
      />
      <SearchView
        searchView={searchView}
        showSearchView={showSearchView}
        searchResults={searchResults}
        setPrivateChatMode={setPrivateChatMode}
        setCurrentChannelId={setCurrentChannelId}
        setPrivateChatBoxId={setPrivateChatBoxId}
        setCurrentChannelName={setCurrentChannelName}
      />
    </section>
  );
}

export default Main;
