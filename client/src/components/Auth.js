import React, { createRef, useContext, useEffect, useState } from "react";
import "../css/Auth.css";
import Logo from "../assets/logo.png";
import { AUTHCONTEXT, MESSAGESCONTEXT, validate } from "../App";
import Pic from '../assets/avatar.jpg';
import { useHistory } from "react-router-dom";

function Auth(props) {

    let {authState,authDispatch}=useContext(AUTHCONTEXT);
    let {messageState,messageDispatch}=useContext(MESSAGESCONTEXT);
    let history=useHistory();

    useEffect(()=>{
      // -user-details
      let userData=JSON.parse(localStorage.getItem('-user-details'));
      if(userData){
        authDispatch({
          type:"LOGIN_USER",
          payload:userData
        });
      }
    },[]);

    useEffect(()=>{
      if(authState.token.length!==0){
        messageDispatch({
          type:"LOAD_MESSAGE_CONTAINERS",
          payload:authState.channels.map(channel=>{
            return channel._id
          })
        });
        history.push("/talkin");
      }
    },[authState]);

    let [logInForm,setLogInForm]=useState(true);
    let picFile=createRef();
    let picView=createRef();

    let logInEmail=createRef();
    let logInPassword=createRef();
    let fakeLogIn=createRef();

    let signUpName=createRef();
    let signUpEmail=createRef();
    let signUpPassword=createRef();
    let fakeSignUp=createRef();

    let logIn=()=>{
      if(!logInEmail.current.checkValidity() || !logInPassword.current.checkValidity()) {
        fakeLogIn.current.click();
        return;
      }
      fetch('http://localhost:3100/auth/login',{
        method:"POST",
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          email:logInEmail.current.value,
          password:logInPassword.current.value
        })
      }).then(res=>res.json())
      .then(data=>{
        if(data.success){
          localStorage.setItem('-user-details',JSON.stringify(data.data));
          console.log(data.data);
          authDispatch({
            type:"LOGIN_USER",
            payload:data.data
          });
        }else alert(data.error);
      }).catch(err=>{
        alert(err);
      });
    };
    let signUp=()=>{
      if(!signUpPassword.current.checkValidity() || 
          !signUpName.current.checkValidity() ||
          !signUpEmail.current.checkValidity()){
        fakeSignUp.current.click();
        return;
      }
      let formData=new FormData();
      if(!(picView.current.src===Pic))
          formData.append('pic',picFile.current.files[0]);
      formData.append('name',signUpName.current.value);
      formData.append('email',signUpEmail.current.value);
      formData.append('password',signUpPassword.current.value);

      fetch('http://localhost:3100/auth/signup',{
        method:"POST",
        body:formData
      }).then(res=>res.json())
      .then(data=>{
        if(data.success) setLogInForm(!logInForm);
        else alert(data.error);
      }).catch(err=>alert(err));
    }
  return (
    <section className="Auth">
      <img src={Logo} alt="logo" />
      {logInForm?<form>
        <h1>Sign in to your Talkin</h1>
        <label for="signInEmail">Enter your talkin's email</label>
        <input
          name="email"
          type="email"
          onChange={validate}
          id="signInEmail"
          required={true}
          placeholder="xxxx@talkin.com"
          className="input _valid"
          ref={logInEmail}
        />
        <label for="signInPassword">Enter your talkin's password</label>
        <input
          ref={logInPassword}
          name="password"
          type="password"
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" 
          onChange={validate}
          title="Must contain at least one number and one uppercase and lowercase letter and at least 8 or more
        characters."
          id="signInPassword"
          required={true}
          placeholder="*************"
          className="input _valid"
        />
        <button className="btn" onClick={(e)=>{
          e.preventDefault();
          logIn();
        }}>Signin</button>
        <button style={{display:"none"}} ref={fakeLogIn}></button>
        <p>Not have one! <strong style={{color:"var(--blue)",cursor:"pointer"}} onClick={()=>setLogInForm(!logInForm)}>Create here</strong></p>
      </form>:<form>
        <h1>Sign up for your Talkin</h1>
        <div className="pic-input">
            <img src={Pic} alt="user-pic" ref={picView}/>
            <input type="file" name="pic" style={{display:"none"}} ref={picFile} onChange={(e)=>{
              if(e.target.files.length==0) {
                picView.current.src=Pic;
              }
              else picView.current.src=URL.createObjectURL(e.target.files[0]);
            }}/>
            <button className="btn" onClick={(e)=>{
                e.preventDefault();
                picFile.current.click();
            }}>Upload Your Pic</button>
        </div>
        <label for="signUpName">Enter your talkin's name</label>
        <input
          name="name"
          type="text"
          onChange={validate}
          id="signUpName"
          required={true}
          ref={signUpName}
          placeholder="Jonas Schemdth"
          className="input _valid"
        />
        <label for="signUpEmail">Enter your talkin's email</label>
        <input
          name="email"
          type="email"
          onChange={validate}
          id="signUpEmail"
          required={true}
          ref={signUpEmail}
          placeholder="xxxx@talkin.com"
          className="input _valid"
        />
        <label for="signUpPassword">Enter your talkin's password</label>
        <input
          name="password"
          type="password"
          onChange={validate}
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" 
          title="Must contain at least one number and one uppercase and lowercase letter and at least 8 or more
        characters."
          id="signUpPassword"
          required={true}
          placeholder="*************"
          ref={signUpPassword}
          className="input _valid"
        />
        <button className="btn" onClick={(e)=>{
          e.preventDefault();
          signUp();
        }}>Signup</button>
        <button style={{display:"none"}} ref={fakeSignUp}></button>
        <p>Back to Login! <strong style={{color:"var(--blue)",cursor:"pointer"}} onClick={()=>setLogInForm(!logInForm)}>Create here</strong></p>
       </form>}
    </section>
  );
}

export default Auth;
