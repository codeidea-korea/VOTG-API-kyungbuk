const express = require('express')
const router = express.Router()
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
const routeName = 'SURVEY'

/* Just Routing */
router.get('/', async (req, res) => {
    try {
        var name = req.query.name

        if (name == null) {
            res.status(200).json(`/${routeName} : No Data`)
        } else {
            res.status(200).json(`/${routeName} : ` + name)
        }
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/copy', async (req, res) => {
    const { UserCode, surveyCode, newSurveyCode } = req.body
    // debug.axios('UserCode', UserCode)
    // debug.axios('surveyCode', surveyCode)
    try {
        // const User = await DB.Users.findOne({
        //     where: { code: Buffer.from(UserCode, 'hex') },
        // })
        // debug.axios('User', User)

        const exSurvey = await DB.UsersSurveyOnlineLayouts.findOne({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
                surveyCode: surveyCode,
            },
        })
        debug.axios('exSurvey.surveyType', exSurvey.surveyType)
        debug.axios('exSurvey.survey', exSurvey.survey)

        if (exSurvey) {
            const createOnlineSurvey = await DB.UsersSurveyOnlineLayouts.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                surveyCode: newSurveyCode,
                status: 0,
                surveyType: exSurvey.surveyType,
                survey: exSurvey.survey,
                sendType: exSurvey.sendType,
                sendContact: `{}`,
                sendURL: `${newSurveyCode}/o`,
                thumbnail: exSurvey.thumbnail,
                fileCode: exSurvey.fileCode,
            })
            // console.log('UsersSurveyDocument', exSurvey)
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'Survey Copy Success',
                payload: {
                    ...createOnlineSurvey,
                },
            })
        } else {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist',
                payload: exSurvey,
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

router.delete('/delete', async (req, res) => {
    const UserCode = req.query.UserCode
    const surveyCode = req.query.surveyCode
    // debug.axios('UserCode', UserCode)
    // debug.axios('surveyCode', surveyCode)
    try {
        // const User = await DB.Users.findOne({
        //     where: { code: Buffer.from(UserCode, 'hex') },
        // })
        // debug.axios('User', User)

        const exSurvey = await DB.UsersSurveyOnlineLayouts.findOne({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
                surveyCode: surveyCode,
            },
        })
        if (exSurvey) {
            const deleteSurvey = await DB.UsersSurveyOnlineLayouts.destroy({
                where: {
                    UserCode: Buffer.from(UserCode, 'hex'),
                    surveyCode: surveyCode,
                },
                force: true,
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
        } else {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist',
                payload: exSurvey,
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
