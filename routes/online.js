const express = require('express')
const router = express.Router()
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const axios = require('axios')

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
        // console.log('UsersSurveyOnlineLayouts', createOnlineSurvey)
        const contactJson = JSON.parse(sendContact)
        console.log('contactJson', contactJson)
        contactJson.phoneNumbers.map((phone, pIndex) => {
            console.log('phoneNumbers', phone)
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
                    content: `[뷰즈온더고]\n설문조사 바로가기\nhttps://survey.gift/`,
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
                    debug.fail('catch', error.message)
                    // return res.status(402).json({
                    //     isSuccess: false,
                    //     code: 402,
                    //     msg: '본인인증 문자 발송 오류',
                    //     payload: error,
                    // })
                })
        })

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
        const { UserCode, fileCode, surveyJson } = req.body
        const deleteSurveyDocuments = await DB.UsersSurveyDocuments.destroy({
            where: { fileCode: fileCode },
            force: true,
        })
        console.log('UsersSurveyDocuments - Delete', deleteSurveyDocuments)
        const createSurveyDocuments = await DB.UsersSurveyDocuments.create({
            UserCode: Buffer.from(UserCode, 'hex'),
            fileCode: fileCode,
            survey: surveyJson.toString(),
        })
        console.log('UsersSurveyDocuments - Change', createSurveyDocuments)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Dstribute Success',
            payload: {
                fileCode,
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
        console.log('UsersSurveyOnlineLayouts', exSurvey)
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
        const { identifyCode, fileCode, answerJson } = req.body
        const createSurveyDocuments = await DB.SurveyAnswers.create({
            identifyCode: Buffer.from(identifyCode, 'hex'),
            fileCode: fileCode,
            answer: answerJson.toString(),
        })
        console.log('UsersSurveyDocuments', createSurveyDocuments)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Answer Complete',
            payload: {
                fileCode,
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

router.get('/survey/answers/result', async (req, res) => {
    // console.log(req)
    try {
        var fileCode = req.query.fileCode
        const exAnswer = await DB.SurveyAnswers.findAll({
            where: {
                fileCode: fileCode,
            },
            attributes: ['identifyCode', 'answer'],
        })
        console.log('SurveyAnswers', exAnswer)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Survey Dstribute Success',
            payload: exAnswer,
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
