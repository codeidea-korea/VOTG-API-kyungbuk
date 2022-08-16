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
const routeName = 'IMP'

/* Just Routing */
router.post('/KGCertify', async (req, res) => {
    try {
        //TEST imp_uid: imp_942336243755
        const { imp_uid } = req.body // request의 body에서 imp_uid 추출
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */
        debug.axios('imp_uid', imp_uid)
        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })
        const { access_token } = getToken.data.response
        const getCertifications = await axios({
            url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
            method: 'get', // GET method
            headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
        })
        const certificationsInfo = getCertifications.data.response
        console.log('certificationsInfo', certificationsInfo)
        const exUser = await DB.Users.findOne({
            where: {
                phone: certificationsInfo.phone,
            },
        })
        if (exUser) {
            const acsTK = jwt.sign({ phone: exUser.phone, email: exUser.email }, jwtSecret, {
                expiresIn: expiresInAcsTK,
            })
            const refTK = jwt.sign(
                {
                    code: exUser.code,
                },
                jwtSecret,
                {
                    expiresIn: expiresInRefTK, // 1 Day
                },
            )

            return res.status(202).json({
                isSuccess: true,
                code: 202,
                msg: 'ok',
                payload: {
                    accessToken: acsTK,
                    refreshToken: refTK,
                },
            })
        } else {
            const hashedPassword = await bcrypt.hash(certificationsInfo.unique_key, 12)
            const createUUID = uuid().toString().replace(/-/g, '')
            const user = await DB.Users.create({
                code: Buffer.from(createUUID, 'hex'),
                name: certificationsInfo.name,
                phone: certificationsInfo.phone,
                email: certificationsInfo.phone,
                password: hashedPassword,
                nickname: certificationsInfo.name,
                mode: 0, // '0:사용자, 1:편집자, 2:관리자, 3:개발자',
                status: 3, // '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
                type: 0, // '0:일반, 1:학생, 2:개인, 3:법인',
            })
            var cerifiedAt = new Date(1000 * 1660184380).getFullYear()
            var birthday = new Date(1000 * 1660184380).getFullYear()
            var ageRange = cerifiedAt - birthday
            const userDetail = await DB.UsersDetail.create({
                UserCode: Buffer.from(createUUID, 'hex'),
                profile: req.body.profile || null,
                arg_phone: req.body.mailing ? 1 : 0,
                arg_email: req.body.mailing ? 1 : 0,
                birthday: certificationsInfo.birthday || null,
                age_range: ageRange || null,
                gender: certificationsInfo.gender || null,
            })
            const acsTK = jwt.sign({ phone: user.phone, email: user.email }, jwtSecret, {
                expiresIn: expiresInAcsTK,
            })
            const refTK = jwt.sign(
                {
                    code: user.code,
                },
                jwtSecret,
                {
                    expiresIn: expiresInRefTK,
                },
            )

            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: 'ok',
                payload: {
                    accessToken: acsTK,
                    refreshToken: refTK,
                },
            })
        }
    } catch (error) {
        console.log('KGCertify', error)
        res.status(400).json({ result: '0', error: error })
    }
})

module.exports = router
