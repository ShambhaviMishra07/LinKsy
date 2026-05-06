
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try{
        //1. get the token from the request header
        //frontend sends it as: authorization

        const authHeader= req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: 'no token, access denied'});
        }
        //2. extracct just the token part (remove bearer)
        const token = authHeader.split(' ')[1];

        //3. verify the token using your secret
        //if the token is expired or tampered with or fake this throws an error
        //if it's valid, decoded will contain{userId, username, iat, exp}

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //4. ATTAch the user the info to the request object
        //any route handler after this middleware can access req.user
        req.user = decoded;

        //pass control to the next middleware or route handler
        next();

    } catch (err){
        res.status(401).json({message: 'token is invalid or expired'});
    }
};

module.exports = authMiddleware;