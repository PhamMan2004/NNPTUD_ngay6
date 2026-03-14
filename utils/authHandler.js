let jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')
let userController = require("../controllers/users")

// Đọc RSA public key
const publicKey = fs.readFileSync(path.join(__dirname, '..', 'keys', 'public.key'), 'utf8')

module.exports = {
    checkLogin: async function (req, res, next) {
        try {
            let token = req.headers.authorization;
            if (!token || !token.startsWith('Bearer')) {
                res.status(404).send("ban chua dang nhap")
                return;
            }
            token = token.split(" ")[1];
            let result = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
            if (result.exp * 1000 > Date.now()) {
                let user = await userController.FindUserById(result.id);
                if (user) {
                    req.user = user
                    next()
                } else {
                    res.status(404).send("ban chua dang nhap")
                }
            } else {
                res.status(404).send("ban chua dang nhap")
            }
        } catch (error) {
            res.status(404).send("ban chua dang nhap")
        }
    }
}