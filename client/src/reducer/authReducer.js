const reducer=(state,action)=>{
    switch(action.type){
        case 'LOGIN_USER':
            return action.payload;
        case 'LOGOUT_USER':
            return {
                email:"",
                name:"",
                pic:"",
                token:"",
                _id:"",
                channels:[],
                wallpaper:""
            };
        case 'ADD_ROOM':
            return {
                ...state,
                channels:[...state.channels,action.payload]
            };
        case 'CHANGE_WALLPAPER':
            return {
                ...state,
                wallpaper:action.payload
            };
        case 'UPDATE_PROFILE':
            return {
                ...state,
                ...action.payload
            };
        default: return state;
    }
}

export default reducer;