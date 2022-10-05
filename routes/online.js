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
        const { UserCode, surveyCode, surveyJson, sendType, sendContact, sendURL, thumbnail } =
            req.body
        const createOnlineSurvey = await DB.UsersSurveyOnlineLayouts.create({
            UserCode: Buffer.from(UserCode, 'hex'),
            surveyCode: surveyCode,
            survey: surveyJson.toString(),
            sendType: sendType,
            sendContact: sendContact.toString(),
            sendURL: sendURL,
            thumbnail: thumbnail,
        })
        console.log('UsersSurveyOnlineLayouts', createOnlineSurvey)
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
            attributes: ['surveyCode', 'status', 'survey', 'sendType', 'createdAt'],
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
