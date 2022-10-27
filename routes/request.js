const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const axios = require('axios')
const { isEmpty, isEqual } = require('lodash')
const nodemailer = require('nodemailer')

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
const routeName = 'REQUEST'

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

router.post('/requestMail', async (req, res) => {
    // console.log('mailConfig', mailConfig)
    try {
        const { name, org, phone, email, area, content, privacy } = req.body
        if (isEmpty(email)) {
            return res.status(402).json({
                isSuccess: false,
                code: 402,
                msg: '이메일 발송 오류',
                payload: res.data,
            })
        }

        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        // const testAccount = await nodemailer.create();

        // create reusable transporter object using the default SMTP transport

        // const randNo = Math.random()
        // const token = jwt.sign({ email, randNo }, jwtConfig.secret, {
        //     expiresIn: 5 * 60 * 1000, // 5분
        // })

        // await models.EmailVeriCode.create({
        //     email,
        //     randId: randNo,
        // })

        // const transporter = nodemailer.createTransport({
        //     service: 'gmail', // 메일 보내는 곳
        //     port: 587,
        //     host: 'smtp.gmlail.com',
        //     secure: true,
        //     requireTLS: true,
        //     auth: {
        //         // user: mailConfig.user, // 보내는 메일의 주소
        //         // pass: mailConfig.pass, // 보내는 메일의 비밀번호
        //         type: 'OAuth2',
        //         user: mailConfig.OAUTH_USER,
        //         clientId: mailConfig.OAUTH_CLIENT_ID,
        //         clientSecret: mailConfig.OAUTH_CLIENT_SECRET,
        //         refreshToken: mailConfig.OAUTH_REFRESH_TOKEN,
        //     },
        // })
        // auth: { user: 'jwlryk@gmail.com', pass: 'bqgamkfolhzhnnar' },
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'votg.survey@gmail.com', pass: 'gwevbcckcxvbxhyw' },
            secure: true,
        })

        // console.log('transporter', transporter)

        await transporter.sendMail({
            from: `votg.survey@gmail.com`, // sender address
            to: `loview@locomotionview.com`, // list of receivers
            subject: '문의 메일입니다.', // Subject line
            //   text: `https://407d-218-39-219-162.ngrok.io/auth/verify?token=${token}`, // plain text body
            html: `<html><p>[문의 메일]</p>
            <p>1.이름 : ${name}</p>
            <p>2.소속기관 : ${org}</p>
            <p>3.휴대폰 : ${phone}</p>
            <p>4,이메일 : ${email}</p>
            <p>5.문의 분야 (중복 선택 가능)</p>
            <p>${area}</p>
            <br/>
            <p>6.문의 내용</p>
            <p>${content}</p>
            <br/>
            <p>7.개인정보 수집 및 이용 동의 : ${privacy ? '동의' : '비동의'}</p></html>`, // html body
        })

        // console.log('Message sent: %s', info.messageId);

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Mail Request Success',
            payload: null,
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
