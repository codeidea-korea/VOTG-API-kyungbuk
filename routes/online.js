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
const cipher = require('../Utils/create-crypto-cipher')
const decipher = require('../Utils/create-crypto-decipher')
const { uuid, empty } = require('uuidv4')
const Cache = require('memory-cache')
const CryptoJS = require('crypto-js')
const createResourceCode = require('../Utils/create-resource-id')

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

// [생성자 호출 - post]  새로 생성 or 업데이트 판단 (설문지 제작중 다음버튼 누를시 자동 저장)
router.post('/survey/save', async (req, res) => {
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
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: ['survey'],
        })
        // console.log('exSurve Length', exSurvey.length)
        if (exSurvey.length === 0) {
            const createOnlineSurvey = await DB.UsersSurveyOnlineLayouts.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                surveyCode: surveyCode,
                status: 0,
                surveyType: surveyType,
                survey: surveyJson.toString(),
                sendType: 3,
                sendContact: `{}`,
                sendURL: sendURL,
                thumbnail: thumbnail,
                fileCode: fileCode,
            })
        } else {
            const updateOnlineSurvey = await DB.UsersSurveyOnlineLayouts.update(
                {
                    // status: 0,
                    // surveyType: surveyType,
                    survey: surveyJson.toString(),
                    sendURL: sendURL,
                    thumbnail: thumbnail,
                    fileCode: fileCode,
                },
                { where: { surveyCode: surveyCode } },
            )
        }

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Save Success',
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

// 사용 X
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
        // console.log('sendType', sendType)
        const contactJson = JSON.parse(sendContact)
        // console.log('contactJson', contactJson)
        if (contactJson.phoneNumbers !== undefined) {
            contactJson.phoneNumbers.map((phone, pIndex) => {
                // console.log('phoneNumbers', phone)

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

// [생성자 호출 - post] 일반 모드 배포
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

        // console.log('UsersSurveyOnlineLayouts - Update', surveyCode)
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
        // console.log('contactJson', contactJson)
        if (contactJson.phoneNumbers !== undefined) {
            contactJson.phoneNumbers.map((phone, pIndex) => {
                // console.log('phoneNumbers', phone)

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
                            // content: `[뷰즈온더고]\n테스터 참여하기\n접속링크:https://viewsonthego.com/auth/login\n아이디:tester@votg.com\n비밀번호:tester00!\n\n설문조사 응답바로가기\nhttps://survey.gift${sendURL}`,
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

// [생성자 호출 - post] 관리자 모드 배포
router.post('/survey/distribute/change/adm', async (req, res) => {
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

        // console.log('UsersSurveyOnlineLayouts - Update', JSON.parse(surveyJson).info?.title)
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
        // console.log('contactJson', contactJson)
        if (contactJson.phoneNumbers !== undefined) {
            // await DB.SurveyAnswersEachUrl.update(
            //     {
            //         status: 4,
            //     },
            //     {
            //         where: {
            //             surveyCode: surveyCode,
            //         },
            //     },
            // )

            const checkDistributeBefore = await DB.SurveyAnswersEachUrl.findAll({
                where: {
                    surveyCode: surveyCode,
                },
                attributes: ['identifyCode', 'phoneCode'],
            })

            const resultExistPhone = checkDistributeBefore?.map((item, pIndex) => {
                const hashedPhone = decipher(item.phoneCode)
                return hashedPhone
            })

            contactJson.phoneNumbers.map(async (phone, pIndex) => {
                let resultIdentifyCode = ''
                // console.log('phoneNumbers', phone)
                // cipher를 통해 생성된 전화번호가 기존의 배포 데이터로서 존재하는지 체크
                // phoneCode,surveyCode 가 일치하는 정보가 있을 경우는 생성 x
                // 기존 설문조사 생성 정보들의 phoneCode 를 decipher로 복호화하여
                // 발송하는 번호와 동일한지 체크
                // console.log('decipher(phoneCode)', decipher(phoneCode))
                // 동일할 경우 identifyCode 갱신 X

                //기존데이터가 존재할 경우 처리
                if (resultExistPhone.length > 0) {
                    console.log('resultExistPhone', resultExistPhone)
                    if (resultExistPhone.includes(phone)) {
                        console.log('phone', phone)
                        // console.log('hashedPhone', hashedPhone)
                        // console.log('Exist item', item.identifyCode)

                        const filteredData = checkDistributeBefore.filter(
                            (item) => decipher(item.phoneCode) == phone,
                        )
                        console.log('filteredData.identifyCode', filteredData[0].identifyCode)
                        resultIdentifyCode = filteredData[0].identifyCode
                        const createSurveyDocuments = await DB.SurveyAnswersEachUrl.update(
                            {
                                status: 5,
                            },
                            {
                                where: {
                                    identifyCode: filteredData[0].identifyCode,
                                    surveyCode: surveyCode,
                                },
                            },
                        )
                    }
                }
                // 기존데이터가 존재하지 않을때 처리
                else {
                    resultIdentifyCode = createResourceCode(8)
                    const phoneCode = cipher(phone)
                    const createSurveyDocuments = await DB.SurveyAnswersEachUrl.create({
                        identifyCode: resultIdentifyCode,
                        phoneCode: phoneCode,
                        surveyCode: surveyCode,
                        answer: `[]`,
                        status: 0,
                    })
                }

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
                            content: `${JSON.parse(surveyJson).info?.title.substr(
                                0,
                                13,
                            )}\n바로가기\nhttps://survey.gift${sendURL}?c=${resultIdentifyCode}`,
                            // content: `소상공인시장진흥공단 수혜업체 만족도조사\n\n안녕하세요 소상공인시장진흥공단은 소상공인 발전을 위하여 만족도 조사를 실시하고 있으니 꼭 참여 부탁드립니다.\n(조사는 에이치앤컨설팅과 뷰즈온더고서베이를 통해 수행됩니다)\n\nhttps://survey.gift${sendURL}`,
                            // content: `[뷰즈온더고]\n테스터 참여하기\n접속링크:https://viewsonthego.com/auth/login\n아이디:tester@votg.com\n비밀번호:tester00!\n\n설문조사 응답바로가기\nhttps://survey.gift${sendURL}`,
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
                                            linkMobile: `https://survey.gift${sendURL}?c=${resultIdentifyCode}`,
                                            linkPc: `https://survey.gift${sendURL}?c=${resultIdentifyCode}`,
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

// [생성자 호출 - post] 관리자 모드 배포 신규
router.post('/survey/distribute/change/admin', async (req, res) => {
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

        // console.log('UsersSurveyOnlineLayouts - Update', JSON.parse(surveyJson).info?.title)
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
        // console.log('contactJson', contactJson)
        if (contactJson.phoneNumbers !== undefined) {
            // await DB.SurveyAnswersEachUrl.update(
            //     {
            //         status: 4,
            //     },
            //     {
            //         where: {
            //             surveyCode: surveyCode,
            //         },
            //     },
            // )

            const checkDistributeBefore = await DB.SurveyAnswersEachUrl.findAll({
                where: {
                    surveyCode: surveyCode,
                },
                attributes: ['identifyCode', 'url', 'phoneCode'],
            })

            const resultExistPhone = checkDistributeBefore?.map((item, pIndex) => {
                const hashedPhone = decipher(item.phoneCode)
                return hashedPhone
            })

            contactJson.phoneNumbers.map(async (phone, pIndex) => {
                let resultIdentifyCode = ''
                let resultEachUrl = ''
                // console.log('phoneNumbers', phone)
                // cipher를 통해 생성된 전화번호가 기존의 배포 데이터로서 존재하는지 체크
                // phoneCode,surveyCode 가 일치하는 정보가 있을 경우는 생성 x
                // 기존 설문조사 생성 정보들의 phoneCode 를 decipher로 복호화하여
                // 발송하는 번호와 동일한지 체크
                // console.log('decipher(phoneCode)', decipher(phoneCode))
                // 동일할 경우 identifyCode 갱신 X

                //기존데이터가 존재할 경우 처리
                if (resultExistPhone.length > 0) {
                    debug.axios('resultExistPhone', resultExistPhone)
                    if (resultExistPhone.includes(phone)) {
                        debug.axios('phone', phone)
                        // console.log('hashedPhone', hashedPhone)
                        // console.log('Exist item', item.identifyCode)

                        const filteredData = checkDistributeBefore.filter(
                            (item) => decipher(item.phoneCode) == phone,
                        )
                        debug.axios('filteredData.url', filteredData[0].url)
                        resultEachUrl = filteredData[0].url
                        const createSurveyDocuments = await DB.SurveyAnswersEachUrl.update(
                            {
                                status: 5,
                            },
                            {
                                where: {
                                    identifyCode: filteredData[0].identifyCode,
                                    url: filteredData[0].url,
                                    surveyCode: surveyCode,
                                },
                            },
                        )
                    }
                }
                // 기존데이터가 존재하지 않을때 처리
                else {
                    resultIdentifyCode = Buffer.from(uuid().toString().replace(/-/g, ''), 'hex')
                    resultEachUrl = createResourceCode(8)
                    const phoneCode = cipher(phone)
                    const createSurveyDocuments = await DB.SurveyAnswersEachUrl.create({
                        identifyCode: resultIdentifyCode,
                        url: resultEachUrl,
                        phoneCode: phoneCode,
                        surveyCode: surveyCode,
                        answer: `[]`,
                        status: 0,
                    })
                }

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
                            content: `${JSON.parse(surveyJson).info?.title.substr(
                                0,
                                13,
                            )}\n바로가기\nhttps://survey.gift${sendURL}?c=${resultEachUrl}`,
                            // content: `소상공인시장진흥공단 수혜업체 만족도조사\n\n안녕하세요 소상공인시장진흥공단은 소상공인 발전을 위하여 만족도 조사를 실시하고 있으니 꼭 참여 부탁드립니다.\n(조사는 에이치앤컨설팅과 뷰즈온더고서베이를 통해 수행됩니다)\n\nhttps://survey.gift${sendURL}`,
                            // content: `[뷰즈온더고]\n테스터 참여하기\n접속링크:https://viewsonthego.com/auth/login\n아이디:tester@votg.com\n비밀번호:tester00!\n\n설문조사 응답바로가기\nhttps://survey.gift${sendURL}`,
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
                                            linkMobile: `https://survey.gift${sendURL}?c=${resultEachUrl}`,
                                            linkPc: `https://survey.gift${sendURL}?c=${resultEachUrl}`,
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

// [생성자 호출 - get] 설문지 생성/수정 단계에서 설문지 정보 로드
router.get('/survey/loaded', async (req, res) => {
    // console.log(req)
    try {
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: ['UserCode', 'survey', 'sendContact'],
        })
        // console.log('UsersSurveyDocument', exSurvey)
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

// [응답자 호출 - get] 설문응답시에 배포된 설문지에 대한 정보로드
router.get('/survey/answer', async (req, res) => {
    // console.log(req)
    try {
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: ['survey', 'status'],
        })
        if (exSurvey === null || exSurvey === undefined) {
            console.error(exSurvey)
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist',
                payload: exSurvey,
            })
        }
        // console.log('UsersSurveyDocument', exSurvey)
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

// [응답자 호출 - get]설문조사를 폰번호를 통해 배포를하여 개별적으로 배포된 설문조사 응답 정보에 대한 내용 체크
router.get('/survey/answer/eachurl', async (req, res) => {
    // console.log(req)
    try {
        var eachUrl = req.query.eachUrl
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.SurveyAnswersEachUrl.findOne({
            where: {
                url: eachUrl,
                surveyCode: surveyCode,
            },
            attributes: ['status', 'identifyCode', 'phoneCode', 'surveyCode'],
        })
        // console.log('UsersSurveyDocument', exSurvey)
        if (exSurvey === null || exSurvey === undefined) {
            console.error(exSurvey)
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist',
                payload: exSurvey,
            })
        }
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Answer Exist ',
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

// [생성자 호출 - get] 로그인 사용자별 설문조사 생성 리스트
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
        const surveyAnswerResult = await Promise.all(
            exSurvey.map((v, index) => {
                const ansResult = DB.SurveyOnlineAnswers.findAll({
                    where: {
                        surveyCode: v.surveyCode,
                    },
                    attributes: ['identifyCode'],
                    order: [['createdAt', 'DESC']],
                })
                return ansResult
            }),
        )

        const surveyListWithAnswerLength = await Promise.all(
            exSurvey.map((v, index) => {
                return { ...v.dataValues, answerLength: surveyAnswerResult[index].length }
            }),
        )

        // console.log('surveyListWithAnswerLength', surveyListWithAnswerLength)

        // console.log('UsersSurveyOnlineLayouts', exSurvey)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey List Success',
            payload: surveyListWithAnswerLength,
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

// [응답자 호출 - post] 설문조사 URL 또는 이메일 발송시 개별적으로 답변을 받았을때 처리
router.post('/survey/answer', async (req, res) => {
    // console.log(req)
    try {
        const { identifyCode, surveyCode, answerJson } = req.body
        const createSurveyDocuments = await DB.SurveyOnlineAnswers.create({
            identifyCode: Buffer.from(identifyCode, 'hex'),
            surveyCode: surveyCode,
            answer: answerJson.toString(),
        })
        // console.log('UsersSurveyDocuments', createSurveyDocuments)
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

// [응답자 호출 = post] 설문조사를 폰번호를 통해 배포를하여 답변을 받았을때 처리
router.post('/survey/answer/eachurl', async (req, res) => {
    // console.log(req)
    try {
        const { eachUrl, phoneCode, surveyCode, answerJson, orderCode, productNumber } = req.body
        const sendingPhoneNumber = decipher(phoneCode)
        // debug.request('decipher(phoneCode)', sendingPhoneNumber)

        const updateEachAnswer = await DB.SurveyAnswersEachUrl.update(
            {
                answer: answerJson.toString(),
                status: 2,
            },
            { where: { url: eachUrl, surveyCode: surveyCode } },
        ).then((result) => {
            debug.axios('updateEachAnswer Result', result)
        })

        const checkProductNumber = await axios
            .post(`${process.env.PROD_API_URL}/gift/goodsInfo/item`, {
                productNumber: productNumber,
            })
            .then(async (r) => {
                debug.axios('checkProductNumber Result', r.data)
            })

        const existEachAnswerInfo = await DB.SurveyAnswersEachUrl.findOne({
            where: { url: eachUrl, surveyCode: surveyCode },
        })
        // debug.axios('existEachAnswerInfo', existEachAnswerInfo)

        const existUserGiftList = await DB.UsersGiftList.findOne({
            where: { orderCode: orderCode },
        })
        // debug.axios('existUserGiftList', existUserGiftList)

        if (existUserGiftList.buying > existUserGiftList.sending) {
            const sendGift = await axios
                .post(`${process.env.PROD_API_URL}/gift/issued/pub`, {
                    phoneNumber: sendingPhoneNumber,
                    productNumber: productNumber,
                })
                .then(async (r) => {
                    if (r.data.isSuccess) {
                        debug.axios('sendGift Result', r.data.payload.CPN_LIST.CPN)
                        await DB.UsersGiftSendLog.create({
                            identifyCode: Buffer.from(existEachAnswerInfo.identifyCode, 'hex'),
                            surveyCode: surveyCode,
                            orderCode: orderCode,
                            cooperNumber: r.data.payload.CPN_LIST.CPN.NO_CPN._text,
                            status: 1,
                            phoneCode: phoneCode,
                        })
                    } else {
                        debug.error('sendGift Error', r.data)
                    }
                })
        }

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Each Answer Complete',
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

// [생성자 호출 - get] 응답자에 대한 결과 생성을 위한
router.get('/survey/answers/result', async (req, res) => {
    // console.log(req)
    try {
        const UserCode = req.query.UserCode
        var surveyCode = req.query.surveyCode
        const exSurvey = await DB.UsersSurveyOnlineLayouts.findOne({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
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
                'updatedAt',
            ],
        })
        if (exSurvey === null || exSurvey === undefined) {
            console.error(exSurvey)
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist',
                payload: exSurvey,
            })
        }
        const exAnswer = await DB.SurveyOnlineAnswers.findAll({
            where: {
                surveyCode: surveyCode,
            },
            attributes: [
                'identifyCode',
                'phoneCode',
                'surveyCode',
                'answer',
                'status',
                'createdAt',
                'updatedAt',
            ],
            order: [['createdAt', 'ASC']],
        })
        // console.log('SurveyOnlineAnswers', exAnswer)
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

router.delete('/survey/delete', async (req, res) => {
    try {
        var UserCode = Buffer.from(req.query.surveyCode, 'hex')
        var surveyCode = req.query.surveyCode
        const deleteSurvey = await DB.UsersSurveyOnlineLayouts.destroy({
            where: {
                UserCode: UserCode,
                surveyCode: surveyCode,
            },
        })
        // console.log('UsersSurveyDocument', exSurvey)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Delete Success',
            payload: {
                ...deleteSurvey,
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

module.exports = router
