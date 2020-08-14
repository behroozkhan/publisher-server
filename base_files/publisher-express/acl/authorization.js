var jwt = require('jsonwebtoken');

export function authorizeToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) res.sendStatus(401);

    jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) res.sendStatus(403);
        req.user = user;
        next();
    });
}