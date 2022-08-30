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
const routeName = 'STORAGE'

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

router.post('/upload', cors(), upload.single('file'), async (req, res) => {
    // console.log(req)
    try {
        const { destination, encoding, fieldname, filename, mimetype, originalname, path } =
            req.file
        const { UserCode } = req.body
        const createUploadLogs = await DB.UsersUploadLogs.create({
            UserCode: Buffer.from(UserCode, 'hex'),
            fileCode: filename,
            fileName: originalname,
            filePath: path,
        })
        console.log('createUploadLogs', createUploadLogs)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Upload Success',
            payload: {
                filename,
                originalname,
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

router.post('/survey/distribute', async (req, res) => {
    // console.log(req)
    try {
        const { UserCode, fileCode, surveyJson } = req.body
        const createSurveyDocuments = await DB.UsersSurveyDocuments.create({
            UserCode: Buffer.from(UserCode, 'hex'),
            fileCode: fileCode,
            survey: surveyJson.toString(),
        })
        console.log('UsersSurveyDocuments', createSurveyDocuments)
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
        var fileCode = req.query.fileCode
        const exSurvey = await DB.UsersSurveyDocuments.findAll({
            where: {
                fileCode: fileCode,
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

module.exports = router
