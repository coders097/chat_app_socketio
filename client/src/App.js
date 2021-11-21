import './App.css';
import React, { createContext, createRef, useEffect, useReducer, useState } from 'react';
import Auth from "./components/Auth";
import Main from "./components/Main";
import PNF from "./components/PNF";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import socketClient from "socket.io-client";
import _authState from './state/authState';
import authReducer from './reducer/authReducer';
import _messagesState from './state/messagesState';
import _messagesReducer from './reducer/messageReducer';

export let validate=(e)=>{
  if(e.target.checkValidity()) e.target.className="input _valid";
  else e.target.className="input _wrong";
}

export const AUTHCONTEXT=createContext();
export const MESSAGESCONTEXT=createContext();

function App() {

  const SERVER = "http://localhost:3200";
  let [io,setIO] = useState(null);

  let [authState,authDispatch]=useReducer(authReducer,_authState);
  
  // ~ Experiment - MANUAL REDUCER  **********************

  let [messageState,setMessageState]=useState({});
  let messageDispatch=(action)=>{
    setMessageState(_messagesReducer(messageState,action));
  }

  //////////////// ****************************************


  let [connectedIO,setConnectedIO]=useState(false);
  
  useEffect(()=>{
    if(!(authState.token==="")){
      if(!connectedIO){
        setIO(socketClient(SERVER));
        setConnectedIO(true);
      }
    }
  },[authState,connectedIO]);
  
  useEffect(()=>{
    io?.emit('linkIdToSocketId',{
      id:authState._id
    });
    if(io){
      let check=localStorage.getItem('hotreload');
      if(!check){
        localStorage.setItem('hotreload','true');
        setTimeout(()=>{
          window.location.reload();
        },600);
      }
    }
  },[io]);

  return (
    
    <BrowserRouter>
      <AUTHCONTEXT.Provider value={{authState,authDispatch}}>
        <MESSAGESCONTEXT.Provider value={{messageState,messageDispatch}}>
          <Switch>
            <Route exact path="/" render={(props)=><Auth/>}/>
            <Route path="/talkin" render={(props)=><Main io={io}/>}/>
            <Route render={(props)=><PNF/>}/>
          </Switch>
        </MESSAGESCONTEXT.Provider>
      </AUTHCONTEXT.Provider>
    </BrowserRouter>
  );
}

export default App;


