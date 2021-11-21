const reducer=(state,action)=>{
    if(action.type==='LOAD_MESSAGE_CONTAINERS'){
        let data={};
        action.payload.forEach((id,i) => {
            data[id]={
                loaded:false,
                messages:[]
            }
        });
        return data;
    }else if(action.type==='ADD_MESSAGE_CONTAINER'){
        return {
            ...state,
            [action.payload]:{
                loaded:false,
                messages:[]
            }
        };
    }else if(action.type==='LOAD_MESSAGES'){
        state[action.payload._id]={
            loaded:true,
            messages:action.payload.messages
        }
        // console.log(state," ",action.payload._id);
        return {...state};
    }else if(action.type==='ADD_MESSAGE'){
        // console.log(state," ",action.payload._id);
        // console.log(action.payload._ifnotpresentmessages);
        // if(!state[action.payload._id]){
        //     state[action.payload._id]={
        //         loaded:false,
        //         messages:[]
        //     };
        // }
        // state[action.payload._id]['messages'].push(action.payload.message);
        return {...state};
    }else return state;
}

export default reducer;