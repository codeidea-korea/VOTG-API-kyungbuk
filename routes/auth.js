const express = require('express')
const router = express.Router()
const axios = require('axios')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
/*Debug*/
const debug = require('../debug')

/* Auth */
const passport = require('passport')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { uuid, empty } = require('uuidv4')
const Cache = require('memory-cache')
const CryptoJS = require('crypto-js')

/* Middle-ware */
const { isNotLoggedIn, isLoggedIn } = require('./middlewares')

/* Sequelize */
const { Op } = require('sequelize')
const DB = require('../models')

/* JWT */
const jwtSecret = process.env.JWT_SECRET

/* Auth Token Expire */
const expiresInAcsTK = 300 // 5 Min
const expiresInRefTK = '1d' // 1 Day

/* Twilio*/
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
const fromNumber = process.env.TWILIO_FROM_NUMBER
const twilio = require('twilio')(accountSid, authToken)

/* NCP SENS*/
const NCP_accessKey = process.env.NCP_ACCESS_KEY
const NCP_secretKey = process.env.NCP_SECRET_KEY
const NCP_serviceID = process.env.NCP_SENS_SMS_ID
const NCP_fromNumber = process.env.NCP_SENS_SMS_FROM_NUMBER
const date = Date.now().toString()
const method = 'POST'
const space = ' '
const newLine = '\n'
const url = `https://sens.apigw.ntruss.com/sms/v2/services/${NCP_serviceID}/messages`
const url2 = `/sms/v2/services/${NCP_serviceID}/messages`
const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, NCP_secretKey)
hmac.update(method)
hmac.update(space)
hmac.update(url2)
hmac.update(newLine)
hmac.update(date)
hmac.update(newLine)
hmac.update(NCP_accessKey)
const hash = hmac.finalize()
const signature = hash.toString(CryptoJS.enc.Base64)

/**
 * Routing Sample
 */
const routeName = 'Auth'

/* Just Routing */
router.post('/login', isNotLoggedIn, async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error(err)
            return next(err)
        }
        if (info) {
            return res.status(401).send(info.reason)
        }

        debug.server('/login : user ', user.dataValues)

        return req.login(user, async (loginErr) => {
            if (loginErr) {
                console.error(loginErr)
                return next(loginErr)
            }
            const acsTK = jwt.sign({ phone: user.phone, email: user.email }, jwtSecret, {
                expiresIn: expiresInAcsTK,
            })
            const refTK = jwt.sign(
                {
                    code: user.code,
                },
                jwtSecret,
                {
                    expiresIn: expiresInRefTK, // 1 Day
                },
            )
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'ok',
                payload: {
                    accessToken: acsTK,
                    refreshToken: refTK,
                },
            })
        })
    })(req, res, next)
})

router.post('/signup', isNotLoggedIn, async (req, res, next) => {
    try {
        const exUser = await DB.Users.findOne({
            where: {
                email: req.body.email,
            },
        })
        if (exUser) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'exist',
                payload: exUser,
            })
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12)
        const createUUID = uuid().toString().replace(/-/g, '')
        const user = await DB.Users.create({
            code: Buffer.from(createUUID, 'hex'),
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            password: hashedPassword,
            nickname: req.body.email.substring(0, req.body.email.indexOf('@')),
            mode: 0, // '0:사용자, 1:편집자, 2:관리자, 3:개발자',
            status: 3, // '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
            type: 0, // '0:일반, 1:학생, 2:개인, 3:법인',
        })
        const userDetail = await DB.UsersDetail.create({
            UserCode: Buffer.from(createUUID, 'hex'),
            profile: req.body.profile || null,
            arg_phone: req.body.mailing ? 1 : 0,
            arg_email: req.body.mailing ? 1 : 0,
            birthday: req.body.birthday || null,
            age_range: req.body.age_range || null,
            gender: req.body.gender || null,
        })

        const acsTK = jwt.sign({ phone: user.phone, email: user.email }, jwtSecret, {
            expiresIn: expiresInAcsTK,
        })
        const refTK = jwt.sign(
            {
                code: user.code,
            },
            jwtSecret,
            {
                expiresIn: expiresInRefTK,
            },
        )
        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: {
                accessToken: acsTK,
                refreshToken: refTK,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

router.post('/user', async (req, res, next) => {
    try {
        const token = req.body.accessToken
        const decoded = jwt.verify(token, jwtSecret)
        const { phone, email } = decoded
        // console.log(decoded)
        const user = await DB.Users.findOne({
            where: {
                phone: phone,
                email: email,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode', 'type'],
        })
        const detail = await DB.UsersDetail.findOne({
            where: {
                UserCode: user.code,
            },
            attributes: [
                'profile',
                'arg_phone',
                'arg_email',
                'birthday',
                'age_range',
                'gender',
                'address_road',
                'address_detail',
                'address_zip',
            ],
        })

        const payment = await DB.UsersPaymentCard.findAll({
            where: {
                UserCode: user.code,
            },
            attributes: ['cardNickName', 'cardName', 'cardNumber'],
        })
        const paymentPasswd = await DB.UsersPaymentPasswd.findAll({
            where: {
                UserCode: user.code,
            },
            attributes: ['createdAt', 'updatedAt', 'deletedAt'],
        })

        const organization = await DB.Organizations.findAll({
            where: {
                OwnerCode: user.code,
            },
            attributes: ['code', 'name', 'url'],
        })

        const userData = {
            ...user.dataValues,
            ...detail.dataValues,
            organization,
            payment,
            paymentPasswd: paymentPasswd.length,
        }
        // console.log(user.code)
        debug.server('/user ', userData)

        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: userData,
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

router.post('/user/verify', async (req, res, next) => {
    try {
        const token = req.body.refreshToken
        const decoded = jwt.verify(token, jwtSecret)
        const { code } = decoded
        const user = await DB.Users.findOne({
            where: {
                code: Buffer.from(code, 'hex'),
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode'],
        })
        debug.server('/user/verify ', user.dataValues)

        return req.login(user, async (loginErr) => {
            if (loginErr) {
                console.error(loginErr)
                return next(loginErr)
            }
            const acsTK = jwt.sign({ phone: user.phone, email: user.email }, jwtSecret, {
                expiresIn: expiresInAcsTK,
            })
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'ok',
                payload: {
                    accessToken: acsTK,
                },
            })
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

router.get('/user/email', async (req, res, next) => {
    try {
        const exUser = await DB.Users.findOne({
            where: {
                email: req.query.email,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode'],
        })
        if (exUser) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'exist',
                payload: exUser.email,
            })
        }
        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'no exist',
            payload: exUser,
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

router.get('/user/phone', async (req, res, next) => {
    try {
        const exUser = await DB.Users.findOne({
            where: {
                phone: req.query.phoneNumber,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode'],
        })
        if (exUser) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'exist',
                payload: exUser.phone,
            })
        }
        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'no exist',
            payload: exUser,
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

/* Message Verification : Send Code*/
router.post('/sendCodeTW', async (req, res) => {
    try {
        const { phoneNumber } = req.body
        Cache.del(phoneNumber)
        const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000
        Cache.put(phoneNumber, verifyCode.toString())

        // 계정 확보되면 문자 발송 코드들 넣을것
        const interPhoneNo = `+82${phoneNumber.substr(1)}`

        twilio.messages
            .create({
                messagingServiceSid,
                from: fromNumber,
                to: `${interPhoneNo}`,
                body: `인증번호\n[${verifyCode}]`,
            })
            .then(async (message) => {
                debug.axios('aRes', message)
                return res.status(200).json({
                    isSuccess: true,
                    code: 200,
                    msg: '본인인증 문자 발송 성공',
                    payload: message,
                })
            })
            .catch((error) => {
                debug.fail('catch', error.message)
                return res.status(402).json({
                    isSuccess: false,
                    code: 402,
                    msg: '본인인증 문자 발송 오류',
                    payload: error,
                })
            })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

/* Message Verification : Send Code*/
router.post('/sendCodeSENS', async (req, res) => {
    try {
        const { phoneNumber } = req.body
        Cache.del(phoneNumber)
        const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000
        Cache.put(phoneNumber, verifyCode.toString())

        axios({
            method: method,
            json: true,
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'x-ncp-iam-access-key': NCP_accessKey,
                'x-ncp-apigw-timestamp': date,
                'x-ncp-apigw-signature-v2': signature,
            },
            data: {
                type: 'SMS',
                contentType: 'COMM',
                countryCode: '82',
                from: NCP_fromNumber,
                // content: `인증번호\n[${verifyCode}]를 입력해주세요.`,

                content: `[뷰즈온더고]\n설문조사 바로가기 https://viewsonthego.com/`,
                messages: [
                    {
                        to: `${phoneNumber}`,
                    },
                ],
            },
        })
            .then(async (aRes) => {
                debug.axios('aRes', aRes.data)
                return res.status(200).json({
                    isSuccess: true,
                    code: 200,
                    msg: '본인인증 문자 발송 성공',
                    payload: aRes.data,
                })
            })
            .catch((error) => {
                debug.fail('catch', error.message)
                return res.status(402).json({
                    isSuccess: false,
                    code: 402,
                    msg: '본인인증 문자 발송 오류',
                    payload: error,
                })
            })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: null,
        })
    }
})

router.post('/verifyNumberSENS', async (req, res) => {
    try {
        const phoneNumber = req.body.phoneNumber
        const verifyCode = req.body.verifyCode

        const CacheData = Cache.get(phoneNumber)

        if (!CacheData) {
            return res.status(404).json({
                isSuccess: false,
                code: 404,
                msg: 'Not Found',
                payload: null,
            })
        } else if (CacheData !== verifyCode) {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Unauthorized',
                payload: null,
            })
        } else {
            Cache.del(phoneNumber)
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                mgs: '본인인증 성공',
                payload: null,
            })
        }
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

module.exports = router
