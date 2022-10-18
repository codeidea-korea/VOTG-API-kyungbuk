const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const axios = require('axios')
const qs = require('qs')
const moment = require('moment')
const convert = require('xml-js')

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
        const { phoneNumber } = req.body

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
            RCV_CTN: `${phoneNumber}`,
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
        const [pubRequest] = await Promise.all([pubRequestPromise])

        const { data: xmlRes } = pubRequest

        const rawJson = JSON.parse(
            convert.xml2json(xmlRes, {
                compact: true,
                spaces: 4,
            }),
        )
        const { CJSERVICE: jsonResult } = rawJson

        return res.status(201).json({
            isSuccess: true,
            code: 201,
            msg: 'Giftcon successfully issued',
            payload: jsonResult,
        })
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            isSuccess: false,
            code: 401,
            msg: 'failed',
            payload: error,
        })
    }
})

router.post('/issued/check', async (req, res) => {
    try {
        const { cooperOrder } = req.body
        const reqData = {
            ACTION: 'CI07113_QUERY_COOPERORDER_WITHPAY',
            SITE_ID: '10002296',
            COOPER_ID: 'SC1459',
            COOPER_PW: 'cwnf98@@',
            COOPER_ORDER: cooperOrder,
        }
        const rawXml = await axios.post(
            'https://atom.donutbook.co.kr/b2ccoupon/b2cservice.aspx',
            qs.stringify(reqData),
        )
        const { data: xmlRes } = rawXml

        const rawJson = JSON.parse(
            convert.xml2json(xmlRes, {
                compact: true,
                spaces: 4,
            }),
        )

        const { CJSERVICE: jsonResult } = rawJson

        return res.status(201).json({
            isSuccess: true,
            code: 201,
            msg: 'Giftcon Check Infomation',
            payload: jsonResult,
        })
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            isSuccess: false,
            code: 401,
            msg: 'failed',
            payload: error,
        })
    }
})

router.post('/goodsInfo', async (req, res) => {
    try {
        const reqData = {
            ACTION: 'CC01_DOWN_ALL_GOODSINFO',
            SITE_ID: '10002296',
            COOPER_ID: 'SC1459',
            COOPER_PW: 'cwnf98@@',
        }
        const rawXml = await axios.post(
            'https://atom.donutbook.co.kr/b2ccoupon/b2cservice.aspx',
            qs.stringify(reqData),
        )
        const { data: xmlRes } = rawXml

        const rawJson = JSON.parse(
            convert.xml2json(xmlRes, {
                compact: true,
                spaces: 4,
            }),
        )

        const { CJSERVICE: jsonResult } = rawJson
        const goodsInfo = jsonResult.GOODS_LIST.GOODS_INFO

        // 다우기술로부터 넘어오는 goodsInfo가 배열일수도 있고 단순 객체일수도 있다.
        // 형태가 객체 안에 객체로 _text라는 key에 value다 달린 형태라 형태를 보기좋게 변환해준다.
        const refinedData = ((info) => {
            return Array.isArray(info)
                ? info.map((goods) => {
                      return Object.keys(goods).reduce((acc, key) => {
                          acc[key] = goods[key]._text
                          return acc
                      }, {})
                  })
                : Object.keys(info).reduce((acc, key) => {
                      acc[key] = info[key]._text
                      return acc
                  }, {})
        })(goodsInfo)

        return res.status(201).json({
            isSuccess: true,
            code: 201,
            msg: 'Goods Infomation',
            payload: refinedData,
        })
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            isSuccess: false,
            code: 401,
            msg: 'failed',
            payload: error,
        })
    }
})
module.exports = router
