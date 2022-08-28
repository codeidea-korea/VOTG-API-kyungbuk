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

/*Debug*/
const debug = require('../debug')

/**
 * Routing Sample
 */
const routeName = 'PAYMENT'

/* Just Routing */
router.get('/', async (req, res) => {
    try {
        var code = req.query.UserCode
        const exCard = await DB.UsersPaymentCard.findAll({
            where: {
                UserCode: Buffer.from(code, 'hex'),
            },
            attributes: [
                'registerCode',
                // 'cardName',
                // 'cardNumber',
                // 'cardExpiration',
                // 'pwd2Digit',
            ],
        })
        if (exCard) {
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'Card Exist',
                payload: exCard.length,
            })
        } else {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'no Data',
                payload: exCard,
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

router.get('/check', async (req, res) => {
    try {
        var code = req.query.UserCode
        var cardNumber = req.query.cardNumber
        var cardConvert = cardNumber.split('-')
        cardConvert[2] = '****'
        cardConvert = cardConvert.join('')

        const exCard = await DB.UsersPaymentCard.findOne({
            where: {
                UserCode: Buffer.from(code, 'hex'),
                cardNumber: cardConvert,
            },
            attributes: ['registerCode'],
        })

        if (exCard) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'Card Exist',
                payload: null,
            })
        } else {
            const exCardLength = await DB.UsersPaymentCard.findAll({
                where: {
                    UserCode: Buffer.from(code, 'hex'),
                },
                attributes: ['cardName'],
            })

            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'no Data',
                payload: exCardLength.length,
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

router.post('/passwdCheck', async (req, res) => {
    try {
        const { UserCode, billingPasswd } = req.body
        const Users = await DB.UsersPaymentPasswd.findOne({
            where: { UserCode: Buffer.from(UserCode, 'hex') },
        })
        const result = await bcrypt.compare(billingPasswd, Users.billingPasswd)
        if (result) {
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'check complete',
                payload: result,
            })
        } else {
            return res.status(200).json({
                isSuccess: false,
                code: 401,
                msg: 'check complete',
                payload: result,
            })
        }
    } catch (error) {
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

router.post('/callbackResult', async (req, res) => {
    try {
        const { UserCode, billingPasswd } = req.body
        const Users = await DB.UsersPaymentPasswd.findOne({
            where: { UserCode: Buffer.from(UserCode, 'hex') },
        })
        const result = await bcrypt.compare(billingPasswd, Users.billingPasswd)
        if (result) {
            return res.status(200).json({
                isSuccess: true,
                code: 200,
                msg: 'check complete',
                payload: result,
            })
        } else {
            return res.status(200).json({
                isSuccess: false,
                code: 401,
                msg: 'check complete',
                payload: result,
            })
        }
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
