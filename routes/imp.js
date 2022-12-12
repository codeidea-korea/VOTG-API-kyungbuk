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
                mode: 1, // '0:설문, 1:패널, 2:관리자, 3:개발자',
                status: 3, // '0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)',
                type: 0, // 0:Free, 1:Basic, 2:Pro, 3:Develop
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

/* Just Routing */
router.post('/issueBilling', async (req, res) => {
    try {
        //TEST imp_uid: imp_942336243755
        const {
            UserCode,
            customerUid,
            cardNickName,
            cardNumber,
            cardExpiration,
            pwd2Digit,
            birthday,
            billingPasswd,
        } = req.body
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API 키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })

        const { access_token } = getToken.data.response // 인증 토큰
        console.log('access_token', access_token)

        const issueBilling = await axios({
            url: `https://api.iamport.kr/subscribe/customers/${customerUid}`,
            method: 'post',
            headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
            data: {
                pg: 'nice.nictest04m',
                card_number: cardNumber, // 카드 번호
                expiry: cardExpiration, // 카드 유효기간
                birth: birthday, // 생년월일
                pwd_2digit: pwd2Digit, // 카드 비밀번호 앞 두자리
            },
        })
        const { code, message, response } = issueBilling.data

        console.log(issueBilling.data)
        if (code === 0) {
            // 빌링키 발급 성공
            const { card_code, card_name, card_number } = response

            const exCardLength = await DB.UsersPaymentCard.findAll({
                where: {
                    UserCode: Buffer.from(UserCode, 'hex'),
                },
                attributes: ['cardName'],
            })
            if (exCardLength.length == 0) {
                const hashedPassword = await bcrypt.hash(billingPasswd, 12)
                const UsersPaymentPasswd = await DB.UsersPaymentPasswd.create({
                    UserCode: Buffer.from(UserCode, 'hex'),
                    billingPasswd: hashedPassword,
                })
            }

            const userPaymentCard = await DB.UsersPaymentCard.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                registerCode: customerUid,
                cardNickName: cardNickName,
                cardCode: card_code,
                cardName: card_name,
                cardNumber: card_number,
            })

            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: 'Billing has successfully issued',
                payload: message,
            })
        } else {
            // 빌링키 발급 실패
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: message,
            })
        }
    } catch (error) {
        console.log('issueBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

/* Just Routing */
router.delete('/deleteBilling', async (req, res) => {
    try {
        const UserCode = req.query.UserCode
        const cardNumber = req.query.cardNumber
        const CardInfo = await DB.UsersPaymentCard.findOne({
            where: { UserCode: Buffer.from(UserCode, 'hex'), cardNumber: cardNumber },
        })

        console.log('CardInfo', CardInfo)
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API 키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })

        const { access_token } = getToken.data.response // 인증 토큰
        console.log('access_token', access_token)

        const deleteBilling = await axios({
            url: `https://api.iamport.kr/subscribe/customers/${CardInfo.registerCode}`,
            method: 'delete',
            headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
            params: {
                customer_uid: CardInfo.registerCode,
            },
        })
        const { code, message } = deleteBilling.data

        console.log(deleteBilling.data)
        if (code === 0) {
            // 빌링키 삭제 성공
            const userPaymentCardDelete = await DB.UsersPaymentCard.destroy({
                where: { registerCode: CardInfo.registerCode },
                force: true,
            })

            const exCardLength = await DB.UsersPaymentCard.findAll({
                where: {
                    UserCode: Buffer.from(UserCode, 'hex'),
                },
                attributes: ['cardName'],
            })
            if (exCardLength.length == 0) {
                const userPaymentPasswdDelete = await DB.UsersPaymentPasswd.destroy({
                    where: { UserCode: Buffer.from(UserCode, 'hex') },
                    force: true,
                })
            }
            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: 'Billing Key deleted Successfull',
                payload: message,
            })
        } else {
            // 빌링키 발급 실패
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: message,
            })
        }
    } catch (error) {
        console.log('deleteBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/onetimeBilling', async (req, res) => {
    try {
        //TEST imp_uid: imp_942336243755
        const { UserCode, customerUid, cardName, cardNumber, cardExpiration, pwd2Digit, birthday } =
            req.body
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API 키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })

        const { access_token } = getToken.data.response // 인증 토큰
        console.log('access_token', access_token)

        const onetimeBilling = await axios({
            url: `https://api.iamport.kr/subscribe/payments/onetime`,
            method: 'post',
            headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
            data: {
                pg: 'nice.nictest04m',
                card_number: cardNumber, // 카드 번호
                expiry: cardExpiration, // 카드 유효기간
                birth: birthday, // 생년월일
                pwd_2digit: pwd2Digit, // 카드 비밀번호 앞 두자리
                customer_uid: customerUid,
                merchant_uid: customerUid,
                amount: 100,
            },
        })
        const { code, message } = onetimeBilling.data

        console.log(onetimeBilling.data)
        if (code === 0) {
            // 빌링키 발급 성공

            const userPaymentCard = await DB.UsersPaymentCard.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                registerCode: customerUid,
                cardName: cardName,
                cardNumber: cardNumber,
                cardExpiration: cardExpiration,
                pwd2Digit: pwd2Digit,
                birthday: birthday,
            })

            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: 'Billing has successfully issued',
                payload: message,
            })
        } else {
            // 빌링키 발급 실패
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: message,
            })
        }
    } catch (error) {
        console.log('issueBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/payBilling', async (req, res) => {
    try {
        const { UserCode, cardNumber, merchantUid, orderType, orderName, price } = req.body

        const CardInfo = await DB.UsersPaymentCard.findOne({
            where: { UserCode: Buffer.from(UserCode, 'hex'), cardNumber: cardNumber },
        })
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API 키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })

        const { access_token } = getToken.data.response // 인증 토큰
        console.log('access_token', access_token)
        const paymentResult = await axios({
            url: `https://api.iamport.kr/subscribe/payments/again`,
            method: 'post',
            headers: { Authorization: access_token }, // 인증 토큰을 Authorization header에 추가
            data: {
                customer_uid: CardInfo.registerCode,
                merchant_uid: merchantUid, // 새로 생성한 결제(재결제)용 주문 번호
                amount: price,
                name: orderName,
            },
        })

        console.log(paymentResult.data)
        const { code, message, response } = paymentResult.data

        if (code === 0) {
            //  카드사 요청 성공

            const {
                status,
                customer_uid,
                imp_uid,
                merchant_uid,
                name,
                card_code,
                card_name,
                card_number,
                amount,
                currency,
                pay_method,
                paid_at,
            } = response

            if (response.status === 'paid') {
                //카드 정상 승인
                return res.status(201).json({
                    isSuccess: true,
                    code: 201,
                    msg: response.status,
                    payload: {
                        status,
                        customer_uid,
                        imp_uid,
                        merchant_uid,
                        name,
                        card_code,
                        card_name,
                        card_number,
                        amount,
                        currency,
                        pay_method,
                        paid_at,
                    },
                })
            } else {
                //카드 승인 실패 (예: 고객 카드 한도초과, 거래정지카드, 잔액부족 등)
                //paymentResult.status : failed 로 수신됨
                return res.status(403).json({
                    isSuccess: false,
                    code: 403,
                    msg: response.fail_reason,
                    payload: {
                        status,
                        customer_uid,
                        imp_uid,
                        merchant_uid,
                        name,
                        card_code,
                        card_name,
                        card_number,
                        amount,
                        currency,
                        pay_method,
                        paid_at,
                    },
                })
            }
        } else {
            // 카드사 요청 실패
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: message,
            })
        }
    } catch (error) {
        console.log('payBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/cancelBilling', async (req, res) => {
    try {
        const { impUid, merchantUid } = req.body
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API 키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })

        const { access_token } = getToken.data.response // 인증 토큰
        console.log('access_token', access_token)

        const cancelResult = await axios({
            url: `https://api.iamport.kr/payments/cancel`,
            method: 'post',
            headers: { Authorization: access_token }, // 인증 토큰을 Authorization header에 추가
            data: {
                imp_uid: impUid,
                merchant_uid: merchantUid,
            },
        })

        console.log(cancelResult.data)
        const { code, message, response } = cancelResult.data

        if (code === 0) {
            //  카드사 요청 성공
            const {
                status,
                customer_uid,
                imp_uid,
                merchant_uid,
                name,
                card_code,
                card_name,
                card_number,
                amount,
                currency,
                pay_method,
                paid_at,
            } = response

            if (response.status === 'cancelled') {
                //카드 정상 취소
                return res.status(201).json({
                    isSuccess: true,
                    code: 201,
                    msg: response.status,
                    payload: {
                        status,
                        customer_uid,
                        imp_uid,
                        merchant_uid,
                        name,
                        card_code,
                        card_name,
                        card_number,
                        amount,
                        currency,
                        pay_method,
                        paid_at,
                    },
                })
            } else {
                //카드 취소 실패
                //paymentResult.status : failed 로 수신됨
                return res.status(403).json({
                    isSuccess: false,
                    code: 403,
                    msg: response.fail_reason,
                    payload: {
                        status,
                        customer_uid,
                        imp_uid,
                        merchant_uid,
                        name,
                        card_code,
                        card_name,
                        card_number,
                        amount,
                        currency,
                        pay_method,
                        paid_at,
                    },
                })
            }
        } else {
            // 카드사 요청 실패
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: message,
            })
        }
    } catch (error) {
        console.log('payBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

router.get('/payCheck', async (req, res) => {
    try {
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        var impUid = req.query.impUid
        const getToken = await axios({
            url: 'https://api.iamport.kr/users/getToken',
            method: 'post', // POST method
            headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
            data: {
                imp_key: '1538504562143613', // REST API 키
                imp_secret:
                    'Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq', // REST API Secret
            },
        })

        const { access_token } = getToken.data.response // 인증 토큰
        console.log('access_token', access_token)

        const getPayResultList = await axios({
            url: `https://api.iamport.kr/payments/${impUid}`, // imp_uid 전달
            method: 'get', // GET method
            headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
        })

        console.log('getPayResultList', getPayResultList)
        const { code, message, response } = getPayResultList.data

        if (code === 0) {
            //  카드사 요청 성공
            const {
                status,
                customer_uid,
                imp_uid,
                merchant_uid,
                name,
                card_code,
                card_name,
                card_number,
                amount,
                currency,
                pay_method,
                paid_at,
            } = response

            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: response.status,
                payload: {
                    status,
                    customer_uid,
                    imp_uid,
                    merchant_uid,
                    name,
                    card_code,
                    card_name,
                    card_number,
                    amount,
                    currency,
                    pay_method,
                    paid_at,
                },
            })
        } else {
            // 카드사 요청 실패
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: message,
            })
        }
    } catch (error) {
        console.log('payBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

module.exports = router
