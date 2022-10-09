const express = require('express')
const router = express.Router()
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const axios = require('axios')
const { isEmpty, isEqual } = require('lodash')
const nodemailer = require('nodemailer')

/* Auth */
const passport = require('passport')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { uuid, empty } = require('uuidv4')
const Cache = require('memory-cache')
const CryptoJS = require('crypto-js')

/* NCP SENS */
const NCP_accessKey = process.env.NCP_ACCESS_KEY
const NCP_secretKey = process.env.NCP_SECRET_KEY
const NCP_serviceID = process.env.NCP_SENS_SMS_ID
const NCP_serviceKAKAO = process.env.NCP_SENS_KAKAO_ID
const NCP_fromNumber = process.env.NCP_SENS_SMS_FROM_NUMBER
// const date = Date.now().toString()
const method = 'POST'
const space = ' '
const newLine = '\n'
const url = `https://sens.apigw.ntruss.com/sms/v2/services/${NCP_serviceID}/messages`
const url2 = `/sms/v2/services/${NCP_serviceID}/messages`
const urlKakao = `https://sens.apigw.ntruss.com/alimtalk/v2/services/${NCP_serviceKAKAO}/messages`
const urlKakao2 = `/alimtalk/v2/services/${NCP_serviceKAKAO}/messages`
// const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, NCP_secretKey)
// hmac.update(method)
// hmac.update(space)
// hmac.update(url2)
// hmac.update(newLine)
// hmac.update(date)
// hmac.update(newLine)
// hmac.update(NCP_accessKey)
// const hash = hmac.finalize()
// const signature = hash.toString(CryptoJS.enc.Base64)

// const hmacKakao = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, NCP_secretKey)
// hmacKakao.update(method)
// hmacKakao.update(space)
// hmacKakao.update(urlKakao2)
// hmacKakao.update(newLine)
// hmacKakao.update(date)
// hmacKakao.update(newLine)
// hmacKakao.update(NCP_accessKey)
// const hashKakao = hmacKakao.finalize()
// const signatureKakao = hashKakao.toString(CryptoJS.enc.Base64)

const env = process.env.NODE_ENV || 'development'
/* Mail */
const mailConfig = (() => {
    // return env === 'test'
    //     ? require('../config/localDev/email.json')[env]
    //     : require('../config/mail.json')[env]
    return require('../config/mail.json')[env]
})()

/* Middle-ware */
const { isNotLoggedIn, isLoggedIn } = require('./middlewares')

/* Sequelize */
const { Op } = require('sequelize')
const DB = require('../models')

/*Debug*/
const debug = require('../debug')

/**
 * Routing Sample
 */
const routeName = 'ONLINE'

/* Upload Path */
const upload = multer({ dest: 'public/uploads/' })

/* Just Routing */
router.post('/', async (req, res) => {
    try {
        const { code, name } = req.body
        res.status(200).json({ code: code, name: name })
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/requestMail', async (req, res) => {
    console.log('mailConfig', mailConfig)
    try {
        const { email } = req.body
        if (isEmpty(email)) {
            return res.status(402).json({
                isSuccess: false,
                code: 402,
                msg: '이메일 발송 오류',
                payload: res.data,
            })
        }

        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        // const testAccount = await nodemailer.create();

        // create reusable transporter object using the default SMTP transport

        // const randNo = Math.random()
        // const token = jwt.sign({ email, randNo }, jwtConfig.secret, {
        //     expiresIn: 5 * 60 * 1000, // 5분
        // })

        // await models.EmailVeriCode.create({
        //     email,
        //     randId: randNo,
        // })

        // const transporter = nodemailer.createTransport({
        //     service: 'gmail', // 메일 보내는 곳
        //     port: 587,
        //     host: 'smtp.gmlail.com',
        //     secure: true,
        //     requireTLS: true,
        //     auth: {
        //         // user: mailConfig.user, // 보내는 메일의 주소
        //         // pass: mailConfig.pass, // 보내는 메일의 비밀번호
        //         type: 'OAuth2',
        //         user: mailConfig.OAUTH_USER,
        //         clientId: mailConfig.OAUTH_CLIENT_ID,
        //         clientSecret: mailConfig.OAUTH_CLIENT_SECRET,
        //         refreshToken: mailConfig.OAUTH_REFRESH_TOKEN,
        //     },
        // })
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'jwlryk@gmail.com', pass: 'oijicyfplboynnmm' },
            secure: true,
        })

        console.log('transporter', transporter)

        await transporter.sendMail({
            from: `lexinery@gmail.com`, // sender address
            to: `${email}`, // list of receivers
            subject: 'Locomotion email verification code', // Subject line
            //   text: `https://407d-218-39-219-162.ngrok.io/auth/verify?token=${token}`, // plain text body
            html: `<a href="https:${process.env.SURVEY_URL}">${process.env.SURVEY_URL}</a>`, // html body
        })

        // console.log('Message sent: %s', info.messageId);

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Dstribute Success',
            payload: null,
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

router.post('/survey/distribute', async (req, res) => {
    // console.log(req)
    try {
        const {
            UserCode,
            surveyCode,
            surveyType,
            surveyJson,
            sendType,
            sendContact,
            sendURL,
            thumbnail,
            fileCode,
        } = req.body
        const createOnlineSurvey = await DB.UsersSurveyOnlineLayouts.create({
            UserCode: Buffer.from(UserCode, 'hex'),
            surveyCode: surveyCode,
            status: 1,
            surveyType: surveyType,
            survey: surveyJson.toString(),
            sendType: sendType,
            sendContact: sendContact.toString(),
            sendURL: sendURL,
            thumbnail: thumbnail,
            fileCode: fileCode,
        })
        //SENS
        console.log('sendType', sendType)
        const contactJson = JSON.parse(sendContact)
        console.log('contactJson', contactJson)
        if (contactJson.phoneNumbers !== undefined) {
            contactJson.phoneNumbers.map((phone, pIndex) => {
                console.log('phoneNumbers', phone)

                if (sendType === 0) {
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
                            content: `[뷰즈온더고]\n설문조사 바로가기\nhttps://survey.gift${sendURL}`,
                            messages: [
                                {
                                    to: `${phone}`,
                                },
                            ],
                        },
                    })
                        .then(async (aRes) => {
                            debug.axios('aRes', aRes.data)
                            // return res.status(200).json({
                            //     isSuccess: true,
                            //     code: 200,
                            //     msg: '본인인증 문자 발송 성공',
                            //     payload: aRes.data,
                            // })
                        })
                        .catch((error) => {
                            debug.fail('catch', error.response.data)
                            // return res.status(error.response.status).json({
                            //     isSuccess: false,
                            //     code: error.response.status,
                            //     msg: '본인인증 문자 발송 오류',
                            //     payload: error.response.data,
                            // })
                        })
                } else if (sendType === 1) {
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
                                    to: `${phone}`,
                                    content: `안녕하세요, 뷰즈온더고입니다. 아래의 버튼을 클릭해 설문조사를 진행해주세요.`,
                                    buttons: [
                                        {
                                            type: 'WL',
                                            name: '설문조사 바로가기',
                                            linkMobile: `https://survey.gift${sendURL}`,
                                            linkPc: `https://survey.gift${sendURL}`,
                                        },
                                    ],
                                },
                            ],
                        },
                    })
                        .then(async (aRes) => {
                            debug.axios('aRes', aRes.data)
                            // return res.status(200).json({
                            //     isSuccess: true,
                            //     code: 200,
                            //     msg: '본인인증 문자 발송 성공',
                            //     payload: aRes.data,
                            // })
                        })
                        .catch((error) => {
                            debug.fail('catch', error)
                            // return res.status(402).json({
                            //     isSuccess: false,
                            //     code: 402,
                            //     msg: '본인인증 문자 발송 오류',
                            //     payload: error,
                            // })
                        })
                }
            })
        }

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Dstribute Success',
            payload: {
                surveyCode,
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

router.post('/survey/distribute/change', async (req, res) => {
    // console.log(req)
    try {
        const {
            UserCode,
            surveyCode,
            // surveyType,
            surveyJson,
            sendType,
            sendContact,
            sendURL,
            thumbnail,
            fileCode,
        } = req.body

        console.log('UsersSurveyOnlineLayouts - Update', surveyCode)
        const updateSurveyLoineLayouts = await DB.UsersSurveyOnlineLayouts.update(
            {
                status: 1,
                // surveyType: surveyType,
                survey: surveyJson.toString(),
                sendType: sendType,
                sendContact: sendContact.toString(),
                sendURL: sendURL,
                thumbnail: thumbnail,
                fileCode: fileCode,
            },
            { where: { surveyCode: surveyCode } },
        )
        //SENS
        const contactJson = JSON.parse(sendContact)
        console.log('contactJson', contactJson)
        if (contactJson.phoneNumbers !== undefined) {
            contactJson.phoneNumbers.map((phone, pIndex) => {
                console.log('phoneNumbers', phone)

                if (sendType === 0) {
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
                            content: `[뷰즈온더고]\n설문조사 바로가기\nhttps://survey.gift${sendURL}`,
                            messages: [
                                {
                                    to: `${phone}`,
                                },
                            ],
                        },
                    })
                        .then(async (aRes) => {
                            debug.axios('aRes', aRes.data)
                            // return res.status(200).json({
                            //     isSuccess: true,
                            //     code: 200,
                            //     msg: '본인인증 문자 발송 성공',
                            //     payload: aRes.data,
                            // })
                        })
                        .catch((error) => {
                            debug.fail('catch', error.response.data)
                            // return res.status(error.response.status).json({
                            //     isSuccess: false,
                            //     code: error.response.status,
                            //     msg: '본인인증 문자 발송 오류',
                            //     payload: error.response.data,
                            // })
                        })
                } else if (sendType === 1) {
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
                                    to: `${phone}`,
                                    content: `안녕하세요, 뷰즈온더고입니다. 아래의 버튼을 클릭해 설문조사를 진행해주세요.`,
                                    buttons: [
                                        {
                                            type: 'WL',
                                            name: '설문조사 바로가기',
                                            linkMobile: `https://survey.gift${sendURL}`,
                                            linkPc: `https://survey.gift${sendURL}`,
                                        },
                                    ],
                                },
                            ],
                        },
                    })
                        .then(async (aRes) => {
                            debug.axios('aRes', aRes.data)
                            // return res.status(200).json({
                            //     isSuccess: true,
                            //     code: 200,
                            //     msg: '본인인증 문자 발송 성공',
                            //     payload: aRes.data,
                            // })
                        })
                        .catch((error) => {
                            debug.fail('catch', error.data)
                            // return res.status(402).json({
                            //     isSuccess: false,
                            //     code: 402,
                            //     msg: '본인인증 문자 발송 오류',
                            //     payload: error,
                            // })
                        })
                }
            })
        }

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Change & Dstribute Success',
            payload: {
                surveyCode,
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

router.get('/survey/loaded', async (req, res) => {
    // console.log(req)
    try {
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: ['survey', 'sendContact'],
        })
        console.log('UsersSurveyDocument', exSurvey)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Loaded Success',
            payload: {
                ...exSurvey,
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

router.get('/survey/answer', async (req, res) => {
    // console.log(req)
    try {
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: ['survey'],
        })
        console.log('UsersSurveyDocument', exSurvey)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Dstribute Success',
            payload: {
                ...exSurvey,
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

router.get('/survey/list', async (req, res) => {
    // console.log(req)
    try {
        const UserCode = req.query.UserCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findAll({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
            },
            attributes: ['surveyCode', 'status', 'survey', 'sendType', 'sendContact', 'createdAt'],
            order: [['createdAt', 'DESC']],
        })
        // console.log('UsersSurveyOnlineLayouts', exSurvey)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey List Success',
            payload: exSurvey,
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

router.post('/survey/answer', async (req, res) => {
    // console.log(req)
    try {
        const { identifyCode, surveyCode, answerJson } = req.body
        const createSurveyDocuments = await DB.SurveyOnlineAnswers.create({
            identifyCode: Buffer.from(identifyCode, 'hex'),
            surveyCode: surveyCode,
            answer: answerJson.toString(),
        })
        console.log('UsersSurveyDocuments', createSurveyDocuments)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Answer Complete',
            payload: {
                surveyCode,
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

router.get('/survey/answers', async (req, res) => {
    // console.log(req)
    try {
        const exAnswer = await DB.SurveyOnlineAnswers.findAll({
            attributes: ['identifyCode', 'surveyCode'],
        })
        console.log('SurveyOnlineAnswers', exAnswer)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Answers List',
            payload: exAnswer,
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

router.get('/survey/answers/result', async (req, res) => {
    // console.log(req)
    try {
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findOne({
            where: {
                surveyCode: surveyCode,
            },
            attributes: [
                'surveyCode',
                'surveyType',
                'survey',
                'status',
                'sendType',
                'sendURL',
                'thumbnail',
                'fileCode',
                'createdAt',
            ],
        })
        const exAnswer = await DB.SurveyOnlineAnswers.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: ['identifyCode', 'answer'],
        })
        console.log('SurveyOnlineAnswers', exAnswer)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Answer Result',
            payload: { selected: exSurvey, result: exAnswer },
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

module.exports = router
