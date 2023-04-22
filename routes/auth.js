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
const NCP_serviceKAKAO = process.env.NCP_SENS_KAKAO_ID
const NCP_fromNumber = process.env.NCP_SENS_SMS_FROM_NUMBER
const method = 'POST'
const space = ' '
const newLine = '\n'
const url = `https://sens.apigw.ntruss.com/sms/v2/services/${NCP_serviceID}/messages`
const url2 = `/sms/v2/services/${NCP_serviceID}/messages`
const urlKakao = `https://sens.apigw.ntruss.com/alimtalk/v2/services/${NCP_serviceKAKAO}/messages`
const urlKakao2 = `/alimtalk/v2/services/${NCP_serviceKAKAO}/messages`

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
            status: 0, // '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
            type: 0, // '0:Stater, 1:Standard, 2:Professional, 3:Dev',
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
        console.log(decoded)
        const user = await DB.Users.findOne({
            where: {
                phone: phone,
                email: email,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode', 'status', 'type'],
        })
        console.log('user', user)
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
            attributes: ['phone', 'email'],
        })
        if (exUser) {
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'exist',
                payload: exUser,
            })
        }

        return res.status(403).json({
            isSuccess: false,
            code: 403,
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
                return res.status(error.response.status).json({
                    isSuccess: false,
                    code: error.response.status,
                    msg: '본인인증 문자 발송 오류',
                    payload: error.response.data,
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
router.post('/sendCodeSENSKakao', async (req, res) => {
    try {
        const date = Date.now().toString()
        const hmacKakao = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, NCP_secretKey)
        hmacKakao.update(method)
        hmacKakao.update(space)
        hmacKakao.update(urlKakao2)
        hmacKakao.update(newLine)
        hmacKakao.update(date)
        hmacKakao.update(newLine)
        hmacKakao.update(NCP_accessKey)
        const hashKakao = hmacKakao.finalize()
        const signatureKakao = hashKakao.toString(CryptoJS.enc.Base64)

        const { phoneNumber } = req.body
        // Cache.del(phoneNumber)
        // const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000
        // Cache.put(phoneNumber, verifyCode.toString())

        axios({
            method: method,
            json: true,
            url: urlKakao,
            headers: {
                'Content-Type': 'application/json',
                'x-ncp-iam-access-key': NCP_accessKey,
                'x-ncp-apigw-timestamp': date,
                'x-ncp-apigw-signature-v2': signatureKakao,
            },
            data: {
                plusFriendId: '@뷰즈온더고',
                templateCode: 'votgalim01',
                messages: [
                    {
                        countryCode: '82',
                        to: `${phoneNumber}`,
                        content: `안녕하세요, 뷰즈온더고입니다. 아래의 버튼을 클릭해 설문조사를 진행해주세요.`,
                        buttons: [
                            {
                                type: 'WL',
                                name: '설문조사 바로가기',
                                linkMobile: `https://viewsonthego.com`,
                                linkPc: `https://viewsonthego.com`,
                            },
                        ],
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
                debug.fail('catch', error.response.data)
                return res.status(error.response.status).json({
                    isSuccess: false,
                    code: error.response.status,
                    msg: '본인인증 문자 발송 오류',
                    payload: error.response.data,
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

/* Message Verification : Send Code*/
router.post('/sendCodeSENS', async (req, res) => {
    try {
        const date = Date.now().toString()
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
                content: `인증번호\n[${verifyCode}]를 입력해주세요.`,

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
                debug.fail('catch', error.data)
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

router.post('/change/info', async (req, res) => {
    try {
        const { UserCode, name, phone, email, mode, status } = req.body

        const User = await DB.Users.findOne({
            where: { code: Buffer.from(UserCode, 'hex') },
        })

        // console.log('User', User)
        debug.query('User', User)

        if (User == null || User == undefined) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'No User',
                payload: null,
            })
        }

        const exUserEamil = await DB.Users.findAll({
            where: {
                email: email,
                code: { [Op.ne]: Buffer.from(UserCode, 'hex') },
            },
            attributes: ['email'],
        })
        if (exUserEamil.length > 0) {
            return res.status(402).json({
                isSuccess: false,
                code: 402,
                msg: 'Exist User Eamil',
                payload: exUserEamil,
            })
        }

        const updateUsers = await DB.Users.update(
            {
                name: name,
                phone: phone,
                email: email,
                mode: mode,
                status: status,
            },
            {
                where: { code: Buffer.from(UserCode, 'hex') },
            },
        )

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Users Update Success',
            payload: {
                updateUsers,
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

router.post('/change/passwd', async (req, res) => {
    try {
        const { UserCode, email, phone, password } = req.body
        const User = await DB.Users.findOne({
            where: UserCode
                ? { code: Buffer.from(UserCode, 'hex') }
                : { email: email, phone: phone },
        })

        // console.log('User', User)
        debug.query('User', User)

        if (User == null || User == undefined) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'No User',
                payload: null,
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const updateUsers = await DB.Users.update(
            {
                password: hashedPassword,
            },
            {
                where: UserCode
                    ? { code: Buffer.from(UserCode, 'hex') }
                    : { email: email, phone: phone },
            },
        )

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Users Passwd Update Success',
            payload: {
                updateUsers,
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

/**
 *
 *
 * PANEL AUTH LINE
 *
 *
 */

/* Just Routing */
router.post('/PNCertify', async (req, res) => {
    try {
        //TEST imp_uid: imp_942336243755
        const { imp_uid } = req.body // request의 body에서 imp_uid 추출
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */
        debug.axios('imp_uid', imp_uid)
        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })
        const { access_token } = getToken.data.response
        const getCertifications = await axios({
            url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
            method: 'get', // GET method
            headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
        })
        const certificationsInfo = getCertifications.data.response
        console.log('certificationsInfo', certificationsInfo)
        const exPanel = await DB.Panels.findOne({
            where: {
                phone: certificationsInfo.phone,
            },
        })
        console.log('exPanel', exPanel)
        if (exPanel) {
            // const acsTK = jwt.sign({ phone: exPanel.phone, email: exPanel.email }, jwtSecret, {
            //     expiresIn: expiresInAcsTK,
            // })
            // const refTK = jwt.sign(
            //     {
            //         code: exPanel.code,
            //     },
            //     jwtSecret,
            //     {
            //         expiresIn: expiresInRefTK, // 1 Day
            //     },
            // )

            return res.status(202).json({
                isSuccess: true,
                code: 202,
                msg: 'Exist User',
                payload: { user: 'exist' },
            })
        } else {
            return res.status(202).json({
                isSuccess: true,
                code: 201,
                msg: 'ok',
                payload: {
                    ...getCertifications.data.response,
                },
            })
        }
    } catch (error) {
        console.log('PNCertify', error)
        res.status(400).json({ result: '0', error: error })
    }
})

/* Just Routing */
router.post('/pn/login', isNotLoggedIn, async (req, res, next) => {
    passport.authenticate('panel', (err, panel, info) => {
        if (err) {
            console.error(err)
            return next(err)
        }
        if (info) {
            return res.status(401).send(info.reason)
        }

        debug.server('/pn/login : user ', panel.dataValues)

        return req.login(panel, async (loginErr) => {
            if (loginErr) {
                console.error(loginErr)
                return next(loginErr)
            }
            const acsTK = jwt.sign({ phone: panel.phone, email: panel.email }, jwtSecret, {
                expiresIn: expiresInAcsTK,
            })
            const refTK = jwt.sign(
                {
                    code: panel.code,
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

router.post('/pn/signup', isNotLoggedIn, async (req, res, next) => {
    try {
        const exPanel = await DB.Panels.findOne({
            where: {
                email: req.body.email,
            },
        })
        if (exPanel) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'exist',
                payload: exPanel,
            })
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12)
        const createUUID = uuid().toString().replace(/-/g, '')
        const panel = await DB.Panels.create({
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
        const panelDetail = await DB.PanelsDetail.create({
            PanelCode: Buffer.from(createUUID, 'hex'),
            profile: req.body.profile || null,
            arg_phone: req.body.mailing ? 1 : 0,
            arg_email: req.body.mailing ? 1 : 0,
            birthday: req.body.birthday || null,
            age_range: req.body.age_range || null,
            gender: req.body.gender || null,
        })

        const acsTK = jwt.sign({ phone: panel.phone, email: panel.email }, jwtSecret, {
            expiresIn: expiresInAcsTK,
        })
        const refTK = jwt.sign(
            {
                code: panel.code,
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

router.post('/panel', async (req, res, next) => {
    try {
        const token = req.body.accessToken
        const decoded = jwt.verify(token, jwtSecret)
        const { phone, email } = decoded
        // console.log(decoded)
        const panel = await DB.Panels.findOne({
            where: {
                phone: phone,
                email: email,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode', 'type'],
        })
        const detail = await DB.PanelsDetail.findOne({
            where: {
                PanelCode: panel.code,
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

        const panelData = {
            ...panel.dataValues,
            ...detail.dataValues,
        }
        // console.log(user.code)
        debug.server('/panel ', panelData)

        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: panelData,
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

router.post('/panel/verify', async (req, res, next) => {
    try {
        const token = req.body.refreshToken
        const decoded = jwt.verify(token, jwtSecret)
        const { code } = decoded
        const panel = await DB.Panels.findOne({
            where: {
                code: Buffer.from(code, 'hex'),
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode'],
        })
        debug.server('/user/verify ', panel.dataValues)

        return req.login(panel, async (loginErr) => {
            if (loginErr) {
                console.error(loginErr)
                return next(loginErr)
            }
            const acsTK = jwt.sign({ phone: panel.phone, email: panel.email }, jwtSecret, {
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

router.get('/panel/email', async (req, res, next) => {
    try {
        const exPanel = await DB.Panels.findOne({
            where: {
                email: req.query.email,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode'],
        })
        if (exPanel) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'exist',
                payload: exPanel.email,
            })
        }
        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'no exist',
            payload: exPanel,
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

router.get('/panel/phone', async (req, res, next) => {
    try {
        const exPanel = await DB.Panels.findOne({
            where: {
                phone: req.query.phoneNumber,
            },
            attributes: ['code', 'name', 'phone', 'email', 'nickname', 'mode'],
        })
        if (exPanel) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'exist',
                payload: exPanel.phone,
            })
        }
        res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'no exist',
            payload: exPanel,
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

router.delete('/account/delete', async (req, res) => {
    try {
        const { UserCode } = req.query
        const User = await DB.Users.findOne({
            where: { code: Buffer.from(UserCode, 'hex') },
        })

        // console.log('User', User)
        debug.query('User', User)

        if (User == null || User == undefined) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'No User',
                payload: null,
            })
        }
        const deleteAccount = await DB.Users.destroy({
            where: { code: Buffer.from(UserCode, 'hex') },
            force: true,
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: deleteAccount,
        })
    } catch (error) {
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

module.exports = router
