const jwt = require("jsonwebtoken");
/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {Function} next 
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader == undefined) {
        res.status(400).send();
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    if (token == undefined) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (error, decoded) => {
        if (error) {
            console.error(error);
            res.status(401).send();
            return;
        }
        req.body.id = decoded.id;
        next();
    });
}

module.exports = { authenticate };