const jwt=require('jsonwebtoken'); 
const jwt_key=process.env.JWT_KEY;

function jwtCheckToken(req,res,next){
    const header=req.header('Authorization');
    const [type,token] = header.split(' ');
    if(type === 'Bearer' && typeof token!=='undefined'){
        try{
            let data=jwt.verify(token,jwt_key);
            req.body._id=data._id;
            next();
        }catch(e){
            res.status(401).send({
                success:false,
                error:'Invalid or expired Token!'
            });
        }
    }else{
        res.status(401).send({
            success:false,
            error:'Invalid Token!'
        });
    }
}

module.exports={
    jwtCheckToken
}