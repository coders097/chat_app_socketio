import React, { createRef, useContext, useState } from 'react';
import { AUTHCONTEXT } from '../App';
import SettingsPic from '../assets/settings.png';

function Navbar(props) { 

    let [connectionLost,setConnectionLost]=useState(false);
    let [openMenu,setOpenMenu]=useState(false);

    let {authState,authDispatch}=useContext(AUTHCONTEXT);

    let {io,setPopUpView,showSearchView,searchView,searchFunction}=props;
    let inputWallpaper=createRef();

    let changeWallpaperUtil=(form)=>{
        fetch('http://localhost:3100/auth/changeWallpaper',{
            method:"POST",
            body:form
        }).then(res=>res.json()).then(data=>{
            if(data.success){
                localStorage.setItem('-user-details',JSON.stringify((function _(){
                    let _data=JSON.parse(localStorage.getItem('-user-details'));
                    if(_data){
                        _data.wallpaper=data.data
                        return _data;
                    }else return null;
                }())));
                authDispatch({
                    type:"CHANGE_WALLPAPER",
                    payload:data.data
                });
            }else{
                alert(data.error);
            }
        }).catch(err=>{
            alert(err);
        }); 
    }
    let changeWallpaper=(type)=>{
        if(type===true){
            if(authState.wallpaper==="") return;
            let form=new FormData();
            form.append("_id",authState._id);
            changeWallpaperUtil(form);
        }else inputWallpaper.current.click();
    }

    return (
        <nav style={{gridArea:"nav"}}>
            <div className={connectionLost?"connection":"connection _lost"}>
                You are currently not connected to the internet. Please check your connection.
            </div>
            <input type="text" placeholder="Search for candidates or rooms!" className="input _valid" 
            onChange={searchFunction}
            onClick={()=>{
                if(!searchView) showSearchView(true);
            }}/>
            <button className="btn">Search</button>
            <p><img src={SettingsPic} onClick={()=>setOpenMenu(!openMenu)}/>
                <div className={openMenu?"menu":"menu _hidden"}>
                    <input type="file" ref={inputWallpaper} style={{display:"none"}} onChange={e=>{
                        if(e.target.files[0].length===0) {
                            alert("Select File First!");
                            return;
                        }
                        let form=new FormData();
                        form.append("_id",authState._id);
                        form.append('pic',e.target.files[0]);
                        changeWallpaperUtil(form);
                    }}/>
                    <p onClick={()=>{
                        changeWallpaper(true);
                    }}>Remove Wallpaper</p>
                    <p onClick={()=>{
                        changeWallpaper(false);
                    }}>Change Wallpaper</p>
                    <p onClick={()=>{
                        setPopUpView({
                            view:true,
                            profileEditView:true,
                            chatAddView:false,
                            roomAddView:false
                        });
                        setOpenMenu(!openMenu);
                    }}>Edit Profile</p>
                </div>
            </p>
            <div className="user">
                <img src={`http://localhost:3100/fetch/getPic?name=${authState.pic}&userpic=true`} alt="user-pic"/>
                <div>
                    <h3>{authState.name}</h3>
                    <button className="btn btn-danger" onClick={()=>{
                        localStorage.removeItem('-user-details');
                        authDispatch({
                            type:'LOGOUT_USER'
                        });
                    }}>Logout</button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;