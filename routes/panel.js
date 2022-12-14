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
const routeName = 'PANEL'

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

/* Just Routing */
router.post('/answer/save', async (req, res, next) => {
    try {
        var result = null
        const { PanelCode, QuestionCode, answerJson } = req.body
        const Panel = await DB.Panels.findOne({
            where: { code: Buffer.from(PanelCode, 'hex') },
        })

        if (Panel === null) {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist User',
                payload: result,
            })
        }

        const PanelAnswerIsExist = await DB.PanelsQuestionAnswer.findOne({
            where: {
                PanelCode: Buffer.from(PanelCode, 'hex'),
                QuestionCode: QuestionCode,
            },
        })

        if (PanelAnswerIsExist === null) {
            const createPanelQuestionAnswer = await DB.PanelsQuestionAnswer.create({
                PanelCode: Buffer.from(PanelCode, 'hex'),
                QuestionCode: QuestionCode,
                answer: answerJson.toString(),
            })
            result = 'create'
            console.log('createPanelQuestionAnswer', createPanelQuestionAnswer)
        } else {
            const createPanelQuestionAnswer = await DB.PanelsQuestionAnswer.update(
                {
                    answer: answerJson.toString(),
                },
                {
                    where: {
                        PanelCode: Buffer.from(PanelCode, 'hex'),
                        QuestionCode: QuestionCode,
                    },
                },
            )
            result = 'update'
        }

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: result,
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

/* Just Routing */
router.post('/answer/check', async (req, res) => {
    try {
        const { PanelCode, QuestionCode } = req.body

        const Panel = await DB.Panels.findOne({
            where: { code: Buffer.from(PanelCode, 'hex') },
        })

        if (Panel === null) {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist User',
                payload: null,
            })
        }

        const PanelAnswerIsExist = await DB.PanelsQuestionAnswer.findOne({
            where: {
                PanelCode: Buffer.from(PanelCode, 'hex'),
                QuestionCode: QuestionCode,
            },
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: PanelAnswerIsExist,
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

/* Just Routing */
router.post('/answer/all', async (req, res) => {
    try {
        const { PanelCode } = req.body

        const Panel = await DB.Panels.findOne({
            where: { code: Buffer.from(PanelCode, 'hex') },
        })

        if (Panel === null) {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'Not Exist User',
                payload: null,
            })
        }

        const PanelAnswerAll = await DB.PanelsQuestionAnswer.findAll({
            attributes: { exclude: ['PanelCode'] },
            where: {
                PanelCode: Buffer.from(PanelCode, 'hex'),
            },
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: PanelAnswerAll,
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
