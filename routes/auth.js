let express = require('express')
let router = express.Router()
let userController = require('../controllers/users')
let { RegisterValidator, ChangePasswordValidator, validatedResult } = require('../utils/validator')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')
const { check } = require('express-validator')
const { checkLogin } = require('../utils/authHandler')

// Đọc RSA keys
const privateKey = fs.readFileSync(path.join(__dirname, '..', 'keys', 'private.key'), 'utf8')

router.post('/register', RegisterValidator, validatedResult, async function (req, res, next) {
    let { username, password, email } = req.body;
    let newUser = await userController.CreateAnUser(
        username, password, email, '69b2763ce64fe93ca6985b56'
    )
    res.send(newUser)
})
router.post('/login', async function (req, res, next) {
    let { username, password } = req.body;
    let user = await userController.FindUserByUsername(username);
    if (!user) {
        res.status(404).send({
            message: "thong tin dang nhap khong dung"
        })
        return;
    }
    if (!user.lockTime || user.lockTime < Date.now()) {
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save();
            let token = jwt.sign({
                id: user._id,
            }, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h'
            })
            res.send(token)
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = new Date(Date.now() + 60 * 60 * 1000)
            }
            await user.save();
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } else {
        res.status(404).send({
            message: "user dang bi ban"
        })
    }

})
router.get('/me', checkLogin, function (req, res, next) {
    res.send(req.user)
})

router.put('/change-password', checkLogin, ChangePasswordValidator, validatedResult, async function (req, res, next) {
    try {
        let { oldPassword, newPassword } = req.body;
        let user = req.user;

        // Kiểm tra oldPassword có đúng không
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(400).send({
                message: "mat khau cu khong dung"
            })
        }

        // Cập nhật password mới
        user.password = newPassword;
        await user.save();

        res.send({
            message: "doi mat khau thanh cong"
        })
    } catch (error) {
        res.status(500).send({
            message: "loi he thong"
        })
    }
})

module.exports = router;