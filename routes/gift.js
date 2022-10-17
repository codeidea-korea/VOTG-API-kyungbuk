const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const axios = require('axios')
const qs = require('qs')
const moment = require('moment')

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
const routeName = 'GIFT'

/* Just Routing */
router.post('/', async (req, res) => {
    try {
        const { code, name } = req.body
        res.status(200).json({ code: code, name: name })
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/issued', async (req, res) => {
    try {
        // const { param_code, param_name } = req.params
        const { phone } = req.body
        // const id = req.params.id

        const curDate = moment().format('YYYYMMDD')
        const reqData = {
            // ACTION: 'CI102_ISSUECPN_WITHPAY',
            SITE_ID: '10001171',
            COOPER_ID: 'SC0292',
            COOPER_PW: 'heen78@!',
            // NO_REQ: giftiReqNo,
            NO_REQ: '44846', // 개발서버 테스트용
            // NO_REQ: '222983', // 실서버 츄파춥스
            COOPER_ORDER: `${moment().format('YYYYMMDDHHmmssSSS')}`,
            ISSUE_COUNT: '1',
            CALL_CTN: '18991294',
            SENDER: 'VOTG-DEVELOP',
            RCV_CTN: phone,
            // RECEIVER: `${user.name.toString()}`,
            SEND_MSG: '뷰즈온더고 리워드 기프티콘입니다.',
            VALID_START: `${curDate}`,
            VALID_END: `${moment(curDate).add(1, 'y').format('YYYYMMDD')}`,
            PAY_ID: 'none',
            BOOKING_NO: 'none',
            SITE_URL: 'none',
        }

        const sendGiftcon = await axios({
            url: 'https://atomtest.donutbook.co.kr:14076/b2ccoupon/b2cservice.asox',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: qs.stringify(reqData),
        })

        console.log('sendGiftcon', sendGiftcon)
        debug.axios('sendGiftcon', sendGiftcon)

        return res.status(201).json({
            isSuccess: true,
            code: 201,
            msg: 'ok',
            payload: sendGiftcon,
        })
    } catch (error) {
        debug.error('sendGiftcon', error)
        res.status(400).json({ result: '0', error: error })
    }
})
router.post('/issued/public', async (req, res) => {
    try {
        // const { param_code, param_name } = req.params
        const { phone } = req.body
        // const id = req.params.id

        const curDate = moment().format('YYYYMMDD')
        const reqData = {
            SITE_ID: '10002296',
            COOPER_ID: 'SC1459',
            COOPER_PW: 'cwnf98@@',
            // NO_REQ: giftiReqNo,
            NO_REQ: '203449', // 개발서버 테스트용
            // NO_REQ: '222983', // 실서버 츄파춥스
            COOPER_ORDER: `${moment().format('YYYYMMDDHHmmssSSS')}`,
            ISSUE_COUNT: '1',
            CALL_CTN: '18991294',
            SENDER: 'VOTG',
            RCV_CTN: phone,
            // RECEIVER: `${user.name.toString()}`,
            SEND_MSG: '뷰즈온더고 리워드 기프티콘입니다.',
            VALID_START: `${curDate}`,
            VALID_END: `59D`,
            PAY_ID: 'none',
            BOOKING_NO: 'none',
            SITE_URL: 'none',
        }

        const sendGiftcon = await axios({
            url: 'https://atom.donutbook.co.kr/b2ccoupon/b2cservice.aspx',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: qs.stringify(reqData),
        })

        console.log('sendGiftcon', sendGiftcon)
        debug.axios('sendGiftcon', sendGiftcon)

        return res.status(201).json({
            isSuccess: true,
            code: 201,
            msg: 'ok',
            payload: sendGiftcon,
        })
    } catch (error) {
        debug.error('sendGiftcon', error)
        res.status(400).json({ result: '0', error: error })
    }
})

module.exports = router
