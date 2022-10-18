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
        console.log('phone', phone)
        console.log('curDate', curDate)
        const sendGiftcon = await axios({
            url: 'https://atomtest.donutbook.co.kr:14076/b2ccoupon/b2cservice.asox',
            method: 'post', // POST method
            // headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                // ACTION: 'CI102_ISSUECPN_WITHPAY',
                SITE_ID: '10001171',
                COOPER_ID: 'SC0292',
                COOPER_PW: 'heen78@!',
                NO_REQ: '44846', // 개발서버 테스트용
                COOPER_ORDER: `VOTG-${moment().format('YYYYMMDDHHmmssSSS')}`,
                ISSUE_COUNT: '1',
                CALL_CTN: '18991294',
                SENDER: 'VOTG-DEVELOP',
                RCV_CTN: phone,
                RECEIVER: `user-${phone}`,
                SEND_MSG: '뷰즈온더고 리워드 기프티콘입니다.',
                VALID_START: `${curDate}`,
                VALID_END: `${moment(curDate).add(1, 'y').format('YYYYMMDD')}`,
                PAY_ID: 'none',
                BOOKING_NO: 'none',
                SITE_URL: 'none',
            },
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
        debug.error('sendGiftcon', error.response)
        res.status(400).json({ result: '0', error: error })
    }
})
router.post('/issued/public', async (req, res) => {
    // var data = {
    //     SITE_ID: '10002296',
    //     COOPER_ID: 'SC1459',
    //     COOPER_PW: 'cwnf98@@',
    //     NO_REQ: '203449',
    //     COOPER_ORDER: 'VOTG-01',
    //     ISSUE_COUNT: '1',
    //     CALL_CTN: '18991294',
    //     SENDER: 'VOTG',
    //     RCV_CTN: '01042152535',
    //     RECEIVER: 'user-01042152535',
    //     SEND_MSG: '뷰즈온더고 리워드 기프티콘입니다.',
    //     VALID_START: '20221017',
    //     VALID_END: '59D',
    //     PAY_ID: 'none',
    //     BOOKING_NO: 'none',
    //     SITE_URL: 'none',
    // }

    var config = {
        method: 'post',
        url: 'https://atom.donutbook.co.kr/b2ccoupon/b2cservice.aspx?ACTION=CI102_ISSUECPN_WITHPAY',
        headers: { 'Content-Type': 'application/json' },
        data: {
            SITE_ID: '10002296',
            COOPER_ID: 'SC1459',
            COOPER_PW: 'cwnf98@@',
            NO_REQ: '203449',
            COOPER_ORDER: `${moment().format('YYYYMMDDHHmmssSSS')}`,
            ISSUE_COUNT: '1',
            CALL_CTN: '18991294',
            SENDER: 'VOTG',
            RCV_CTN: '01042152535',
            RECEIVER: 'user-01042152535',
            SEND_MSG: '뷰즈온더고 리워드 기프티콘입니다.',
            VALID_START: '20221017',
            VALID_END: '59D',
            PAY_ID: 'none',
            BOOKING_NO: 'none',
            SITE_URL: 'none',
        },
    }

    axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data))
            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: 'Giftcon successfully issued',
                payload: response.data,
            })
        })
        .catch(function (error) {
            console.log(error)
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: error,
            })
        })
})

/*
"production":{
        "COOPER_ID":"SC1459",
        "COOPER_PW":"cwnf98@@",
        "SITE_ID":"10002296",
        "CALL_CTN":"18991294",
        "SENDER":"로코모션뷰 리워드 기프티콘",
        "SEND_MSG":"로코모션뷰 리워드 기프티콘입니다.",
        "URL":"https://atom.donutbook.co.kr/b2ccoupon/b2cservice.aspx"
    },
    */
router.post('/issued/pub', async (req, res) => {
    try {
        const curDate = moment().format('YYYYMMDD')
        const reqData = {
            ACTION: 'CI102_ISSUECPN_WITHPAY',
            SITE_ID: '10002296',
            COOPER_ID: 'SC1459',
            COOPER_PW: 'cwnf98@@',
            NO_REQ: '203449',
            COOPER_ORDER: `${moment().format('YYYYMMDDHHmmssSSS')}`,
            ISSUE_COUNT: '1',
            CALL_CTN: '18991294',
            SENDER: '로코모션뷰 리워드 기프티콘',
            RCV_CTN: '01042152535',
            RECEIVER: '테스터단',
            SEND_MSG: '로코모션뷰 리워드 기프티콘입니다.',
            VALID_START: `${curDate}`,
            VALID_END: `${moment(curDate).add(1, 'y').format('YYYYMMDD')}`,
            PAY_ID: 'fajsdkfq',
            BOOKING_NO: 'joiwfef',
            SITE_URL: 'nkew',
        }
        const pubRequestPromise = axios.post(
            'https://atom.donutbook.co.kr/b2ccoupon/b2cservice.aspx',
            qs.stringify(reqData),
        )
        const pubRequest = await Promise.all(pubRequestPromise)

        console.log(pubRequest)
        return res.status(201).json({
            isSuccess: true,
            code: 201,
            msg: 'Giftcon successfully issued',
            payload: pubRequest,
        })
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            isSuccess: false,
            code: 401,
            msg: 'failed',
            payload: error,
        })
    }
})

module.exports = router
