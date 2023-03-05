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

//카드 등록확인
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

//카드 등록 비밀번호 확인
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

// 카드등록 처리
router.post('/issueBilling', async (req, res) => {
    try {
        //TEST imp_uid: imp_942336243755
        /*
            "CPID" : "CMP67648",
            "PAYMETHOD": "CARD-KEYGEN",
            "ORDERNO": "13cf0bcfcb7347d8800247cae6982b99-220910-0",
            "PRODUCTTYPE":"1",
            "BILLTYPE":"14",
            "AMOUNT":"0",
            "PRODUCTNAME":"CARD-KEYGEN-ISSUED",
            "IPADDRESS": "0.0.0.0",
            "USERID":"13cf0bcfcb7347d8800247cae6982b99",
            "PRODUCTCODE": "card-keygen-issue",
            "CARDNO": "5365101935100341",
            "EXPIREDT": "202703",
            "CARDAUTH":"960609",
            "CARDPASSWORD": "06",
            "QUOTA": "00",
            "TAXFREECD": "00",
            "DIRECT_YN":"N"
        */
        const {
            UserCode,
            cardNickName,
            customerUid,
            cardNumber,
            cardExpiration,
            birthday,
            billingPasswd,
            pwd2Digit,
        } = req.body
        //REST API Key: 1538504562143613
        //REST API Secret

        console.log('res', req.body)

        var cardConvert = cardNumber.split('-')
        var issueCardNumber = cardConvert.join('')
        cardConvert[2] = '****'
        var cardConvert = cardConvert.join('')

        const getToken = await axios({
            url: 'https://api.payjoa.co.kr/pay/ready',
            method: 'post', // POST method
            headers: {
                'Content-Type': 'application/json',
                charset: 'EUC-KR',
                Authorization: 'f11ffe37d412e163f886f745519ffb0bd6a72cbb396165b39285f157b6bb3031',
            }, // "Content-Type": "application/json"
            data: {
                CPID: 'CMP67648',
                PAYMETHOD: 'CARD-KEYGEN',
            },
        })

        const { RETURNURL, TOKEN } = getToken.data // 인증 토큰
        console.log('getToken', getToken.data)
        console.log('RETURNURL', RETURNURL)
        console.log('TOKEN', TOKEN)

        // return res.status(200).json({
        //     isSuccess: true,
        //     code: 200,
        //     msg: 'TOKEN ISSUED SUCCESS',
        //     payload: getToken.data,
        // })

        const issueBilling = await axios({
            url: `${RETURNURL}`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                charset: 'EUC-KR',
                Authorization: 'f11ffe37d412e163f886f745519ffb0bd6a72cbb396165b39285f157b6bb3031',
                TOKEN: TOKEN,
            }, // 인증 토큰 Authorization header에 추가
            data: {
                CPID: 'CMP67648',
                PAYMETHOD: 'CARD-KEYGEN',
                ORDERNO: `key-gen-${customerUid}-${Date.now()}`,
                PRODUCTTYPE: '1',
                BILLTYPE: '14',
                AMOUNT: '0',
                PRODUCTNAME: 'CARD-KEYGEN-ISSUED',
                IPADDRESS: '0.0.0.0',
                USERID: `${customerUid}`,
                PRODUCTCODE: 'card-keygen-issue',
                CARDNO: `${issueCardNumber}`,
                EXPIREDT: `${cardExpiration}`,
                CARDAUTH: `${birthday}`,
                CARDPASSWORD: `${pwd2Digit}`,
                QUOTA: '00',
                TAXFREECD: '00',
                DIRECT_YN: 'N',
            },
        })
        const {
            RESULTCODE,
            ERRORMESSAGE,
            CARDCODE,
            AUTOKEY,
            PAYMETHOD,
            GENDATE,
            TOKEN: issuedTOKEN,
        } = issueBilling.data

        console.log('issueBilling.data', issueBilling.data)
        if (issueBilling.data.RESULTCODE === '0000') {
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

            /*
                CCKM	KB국민카드	CCKW	조흥카드
                CCNH	농협NH카드	CCLG	신한카드
                CCSG	신세계한미	CMCF	해외마스터
                CCCT	씨티카드	CJCF	해외JCB
                CCHM	한미카드	CCKE	하나카드(구 외환카드)
                CVSF	해외비자	CDIF	해외다이너스
                CCAM	국내아멕스	CCDI	현대카드
                CCLO	롯데카드	CCSB	저축은행카드
                CAMF	해외아멕스	CCKD	산은카드
                CCBC	BC카드	CCCH	축협카드
                CCPH	우리카드	CCMG	새마을금고카드
                CCHN	하나SK카드	CCPO	우체국카드
                CCSS	삼성카드	CCHD	현대증권카드
                CCKJ	광주카드	CNHS	NH투자증권
                CCSU	수협카드	CKBK	K뱅크
                CCCU	신협카드	CCKA	카카오뱅크
                CCJB	전북카드	CCTS	토스뱅크
                CCCJ	제주카드	　	　
            */
            let card_name = ''
            if (CARDCODE === 'CCKM') {
                card_name = 'KB국민카드'
            } else if (CARDCODE === 'CCNH') {
                card_name = '농협NH카드'
            } else if (CARDCODE === 'CCSG') {
                card_name = '신세계한미'
            } else if (CARDCODE === 'CCCT') {
                card_name = '씨티카드'
            } else if (CARDCODE === 'CCHM') {
                card_name = '한미카드'
            } else if (CARDCODE === 'CCBC') {
                card_name = 'BC카드'
            }

            const userPaymentCard = await DB.UsersPaymentCard.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                registerCode: AUTOKEY,
                cardNickName: cardNickName,
                cardCode: CARDCODE,
                cardName: card_name,
                cardNumber: cardConvert,
            })

            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: 'Billing has successfully issued',
                payload: ERRORMESSAGE,
            })
        } else {
            return res.status(401).json({
                isSuccess: false,
                code: 401,
                msg: 'failed',
                payload: ERRORMESSAGE,
            })
        }

        // console.log(issueBilling.data)
        // if (code === 0) {
        //     // 빌링키 발급 성공
        //     const { card_code, card_name, card_number } = response

        //     const exCardLength = await DB.UsersPaymentCard.findAll({
        //         where: {
        //             UserCode: Buffer.from(UserCode, 'hex'),
        //         },
        //         attributes: ['cardName'],
        //     })
        //     if (exCardLength.length == 0) {
        //         const hashedPassword = await bcrypt.hash(billingPasswd, 12)
        //         const UsersPaymentPasswd = await DB.UsersPaymentPasswd.create({
        //             UserCode: Buffer.from(UserCode, 'hex'),
        //             billingPasswd: hashedPassword,
        //         })
        //     }

        //     const userPaymentCard = await DB.UsersPaymentCard.create({
        //         UserCode: Buffer.from(UserCode, 'hex'),
        //         registerCode: customerUid,
        //         cardNickName: cardNickName,
        //         cardCode: card_code,
        //         cardName: card_name,
        //         cardNumber: card_number,
        //     })

        //     return res.status(201).json({
        //         isSuccess: true,
        //         code: 201,
        //         msg: 'Billing has successfully issued',
        //         payload: message,
        //     })
        // } else {
        //     // 빌링키 발급 실패
        //     return res.status(401).json({
        //         isSuccess: false,
        //         code: 401,
        //         msg: 'failed',
        //         payload: message,
        //     })
        // }
    } catch (error) {
        console.log('issueBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

//등록된 카드 결제
router.post('/payBilling', async (req, res) => {
    try {
        const {
            UserCode,
            customerUid,
            cardNumber,
            merchantUid,
            orderType,
            orderName,
            price,
            orderCount,
            productNumber,
        } = req.body

        const CardInfo = await DB.UsersPaymentCard.findOne({
            where: { UserCode: Buffer.from(UserCode, 'hex'), cardNumber: cardNumber },
        })
        // console.log('CardInfo.registerCode', CardInfo.registerCode)
        //REST API Key: 1538504562143613
        //REST API Secret
        /*
            Bsq53gJBbgykdlt4BIX1FMiI7vakL3uAwvVPIE5xEwUupnhGyNEUSqB69D4iAVTeS6GpM4LEqjknz0zq
        */

        const getToken = await axios({
            url: 'https://api.payjoa.co.kr/pay/ready',
            method: 'post', // POST method
            headers: {
                'Content-Type': 'application/json',
                charset: 'EUC-KR',
                Authorization: 'f11ffe37d412e163f886f745519ffb0bd6a72cbb396165b39285f157b6bb3031',
            }, // 인증 토큰 Authorization header에 추가
            data: {
                CPID: 'CMP67648',
                PAYMETHOD: 'CARD-BATCH',
            },
        })

        const { RETURNURL, TOKEN } = getToken.data // 인증 토큰
        // console.log('getToken', getToken.data)

        const paymentResult = await axios({
            url: `${RETURNURL}`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                charset: 'EUC-KR',
                Authorization: 'f11ffe37d412e163f886f745519ffb0bd6a72cbb396165b39285f157b6bb3031',
                TOKEN: TOKEN,
            }, // 인증 토큰 Authorization header에 추가
            data: {
                CPID: 'CMP67648',
                PAYMETHOD: 'CARD-KEYGEN',
                ORDERNO: `order-${customerUid}-${Date.now()}`,
                PRODUCTTYPE: '1',
                BILLTYPE: '14',
                AMOUNT: price,
                // AMOUNT: '1000',
                PRODUCTNAME: orderName,
                IPADDRESS: '0.0.0.0',
                USERID: `${Buffer.from(UserCode, 'hex').toString('hex')}`,
                PRODUCTCODE: merchantUid,
                QUOTA: '00',
                TAXFREECD: '00',
                AUTOKEY: CardInfo.registerCode,
            },
        })
        /*{
            "CPID" : "CMP67648",
            "PAYMETHOD": "CARD-KEYGEN",
            "ORDERNO": "13cf0bcfcb7347d8800247cae6982b99-220910-0",
            "PRODUCTTYPE":"1",
            "BILLTYPE":"14",
            "AMOUNT":"1000",
            "PRODUCTNAME":"BASIC PLAN",
            "IPADDRESS": "172.24.4.23",
            "USERID":"13cf0bcfcb7347d8800247cae6982b99",
            "PRODUCTCODE": "basic-00",
            "QUOTA": "00",
            "TAXFREECD": "00",
            "AUTOKEY":"C20229T2A4213"
        }*/

        console.log('paymentResult', paymentResult.data)

        /*
            "ERRORMESSAGE": "정상 처리 되었습니다.",
            "DAOUTRX": "cMP22092917234729774",
            "AUTHNO": "40091184",
            "CPTELNO": "1899-1294",
            "RESULTCODE": "0000",
            "AUTOKEY": "C20229S2A4020",
            "AMOUNT": "500",
            "ORDERNO": "13cf0bcfcb7347d8800247cae6982b99-220910-0",
            "CPURL": "https://viewsonthego.com",
            "CPNAME": "(주)로코모션뷰",
            "PAYMETHOD": "CARD-BATCH",
            "AUTHDATE": "20220929172347",
            "TOKEN": "4244afd4d4d015a44486819b05ae7b09ae"
        */

        const { RESULTCODE, ERRORMESSAGE, AUTHNO, DAOUTRX, CPTELNO, AMOUNT, AUTHDATE } =
            paymentResult.data

        if (RESULTCODE === '0000') {
            if (orderType == 0) {
                await DB.UsersPaymentRequest.create({
                    UserCode: Buffer.from(UserCode, 'hex'),
                    issuedAt: Date.now(),
                    status: 1,
                    billingUid: DAOUTRX,
                    registerCode: CardInfo.registerCode,
                    orderType: orderType,
                    orderCode: merchantUid,
                    orderName: orderName,
                    amount: price,
                    orderCount: orderCount,
                    productNumber: productNumber,
                })
                if (orderName.includes('Starter')) {
                    await DB.Users.update(
                        {
                            status: 3,
                            type: 0,
                        },
                        {
                            where: {
                                code: Buffer.from(UserCode, 'hex'),
                            },
                        },
                    )
                } else if (orderName.includes('Standard')) {
                    await DB.Users.update(
                        {
                            status: 3,
                            type: 1,
                        },
                        {
                            where: {
                                code: Buffer.from(UserCode, 'hex'),
                            },
                        },
                    )
                } else if (orderName.includes('Professional')) {
                    await DB.Users.update(
                        {
                            status: 3,
                            type: 2,
                        },
                        {
                            where: {
                                code: Buffer.from(UserCode, 'hex'),
                            },
                        },
                    )
                }
            } else if (orderType == 2) {
                const UsersGiftList = await DB.UsersGiftList.create({
                    UserCode: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                    status: '1',
                    orderCode: exOrderTypeCheck.orderCode,
                    orderName: exOrderTypeCheck.orderName,
                    productNumber: exOrderTypeCheck.productNumber,
                    buying: exOrderTypeCheck.orderCount,
                    sending: 0,
                })
                await DB.UsersPaymentRequest.create({
                    UserCode: Buffer.from(UserCode, 'hex'),
                    issuedAt: Date.now(),
                    status: 1,
                    billingUid: DAOUTRX,
                    registerCode: CardInfo.registerCode,
                    orderType: orderType,
                    orderCode: merchantUid,
                    orderName: orderName,
                    amount: price,
                    orderCount: orderCount,
                    productNumber: productNumber,
                })
            }

            return res.status(201).json({
                isSuccess: true,
                code: 201,
                msg: ERRORMESSAGE,
                payload: paymentResult.data,
            })
        } else {
            await DB.UsersPaymentRequest.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                issuedAt: Date.now(),
                status: 2,
                billingUid: DAOUTRX,
                registerCode: CardInfo.registerCode,
                orderType: orderType,
                orderCode: merchantUid,
                orderName: orderName,
                amount: price,
                orderCount: orderCount,
                productNumber: productNumber,
            })
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: ERRORMESSAGE,
                payload: paymentResult.data,
            })
        }
    } catch (error) {
        console.log('payBilling', error)
        res.status(400).json({ result: '0', error: error })
    }
})

//일반 카드결제 결제 캐시
router.post('/cachedBilling', async (req, res) => {
    try {
        const { UserCode, orderCode, orderType, orderName, price, orderCount, productNumber } =
            req.body
        Cache.del(orderCode)
        Cache.put(orderCode, false, 1000 * 60 * 5)
        debug.axios('cachedBilling', req.body)
        // debug.axios('orderCode', orderCode)
        const exOrderCode = await DB.UsersPaymentRequest.findAll({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
                orderCode: orderCode,
            },
        })
        if (!exOrderCode.length > 0) {
            await DB.UsersPaymentRequest.create({
                UserCode: Buffer.from(UserCode, 'hex'),
                issuedAt: Date.now(),
                status: 0,
                orderType: orderType,
                orderCode: orderCode,
                orderName: orderName,
                amount: price,
                orderCount: orderCount,
                productNumber: productNumber,
            })
        } else {
            await DB.UsersPaymentRequest.update(
                {
                    issuedAt: Date.now(),
                    status: 0,
                    orderType: orderType,
                    orderName: orderName,
                    amount: price,
                    orderCount: orderCount,
                    productNumber: productNumber,
                },
                {
                    where: {
                        UserCode: Buffer.from(UserCode, 'hex'),
                        orderCode: orderCode,
                    },
                },
            )
        }

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'CachedBilling complete',
            payload: { orderCode },
        })
    } catch (error) {
        return res.status(400).json({
            isSuccess: false,
            code: 400,
            msg: 'Bad Request',
            payload: error,
        })
    }
})

//결제 확인 통보 : 다우결제시스템 => 서버에 응답코드
router.get('/checkout', async (req, res) => {
    try {
        //일반결제 결과 통보 확인
        debug.axios('checkout', req.query)
        // debug.axios('checkout', req.query.USERID)
        // debug.axios('checkout', req.query.ORDERNO)
        Cache.put(req.query.ORDERNO, true, 1000 * 30)

        const exOrderTypeCheck = await DB.UsersPaymentRequest.findOne({
            where: {
                orderCode: req.query.ORDERNO,
            },
            // attributes: { exclude: ['password'] },
            // order: [['createdAt', 'DESC']],
        })

        debug.axios('exOrderTypeCheck', exOrderTypeCheck)
        if (exOrderTypeCheck.orderType == 0 || exOrderTypeCheck.orderType == 1) {
            const exOrderUpdate = await DB.UsersPaymentRequest.update(
                {
                    issuedAt: Date.now(),
                    status: 1,
                    registerCode: 'demo-CARDNO',
                    billingUid: 'demo-DAOUTRX',
                },
                {
                    where: {
                        orderCode: req.query.ORDERNO,
                    },
                },
            ).then((result) => {
                console.log('result', result)
            })
            if (exOrderTypeCheck.orderName.includes('Starter')) {
                await DB.Users.update(
                    {
                        status: 3,
                        type: 0,
                    },
                    {
                        where: {
                            code: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                        },
                    },
                )
            } else if (exOrderTypeCheck.orderName.includes('Standard')) {
                await DB.Users.update(
                    {
                        status: 3,
                        type: 1,
                    },
                    {
                        where: {
                            code: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                        },
                    },
                )
            } else if (exOrderTypeCheck.orderName.includes('Professional')) {
                await DB.Users.update(
                    {
                        status: 3,
                        type: 2,
                    },
                    {
                        where: {
                            code: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                        },
                    },
                )
            }
        } else if (exOrderTypeCheck.orderType == 2) {
            const UsersGiftList = await DB.UsersGiftList.create({
                UserCode: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                status: '1',
                orderCode: exOrderTypeCheck.orderCode,
                orderName: exOrderTypeCheck.orderName,
                productNumber: exOrderTypeCheck.productNumber,
                buying: exOrderTypeCheck.orderCount,
                sending: 0,
            })
            const exOrderUpdate = await DB.UsersPaymentRequest.update(
                {
                    issuedAt: Date.now(),
                    status: 1,
                    registerCode: req.query.CARDNO,
                    billingUid: req.query.DAOUTRX,
                },
                {
                    where: {
                        orderCode: req.query.ORDERNO,
                    },
                },
            ).then((result) => {
                console.log('result', result)
            })
        }

        return res.status(200).send(`<html><body><RESULT>SUCCESS</RESULT></body></html>`)
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

router.get('/checkout/demo', async (req, res) => {
    try {
        //일반결제 결과 통보 확인
        debug.axios('checkout/demo', req.query)
        // debug.axios('checkout', req.query.USERID)
        // debug.axios('checkout', req.query.ORDERNO)
        // Cache.put(req.query.ORDERNO, true, 1000 * 30)

        const exOrderTypeCheck = await DB.UsersPaymentRequest.findOne({
            where: {
                orderCode: req.query.ORDERNO,
            },
            // attributes: { exclude: ['password'] },
            // order: [['createdAt', 'DESC']],
        })

        debug.axios('exOrderTypeCheck', exOrderTypeCheck)
        if (exOrderTypeCheck.orderType == 0 || exOrderTypeCheck.orderType == 1) {
            const exOrderUpdate = await DB.UsersPaymentRequest.update(
                {
                    issuedAt: Date.now(),
                    status: 1,
                    registerCode: 'demo-CARDNO',
                    billingUid: 'demo-DAOUTRX',
                },
                {
                    where: {
                        orderCode: req.query.ORDERNO,
                    },
                },
            ).then((result) => {
                console.log('result', result)
            })
            if (exOrderTypeCheck.orderName.includes('Starter')) {
                await DB.Users.update(
                    {
                        status: 3,
                        type: 0,
                    },
                    {
                        where: {
                            code: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                        },
                    },
                )
            } else if (exOrderTypeCheck.orderName.includes('Standard')) {
                await DB.Users.update(
                    {
                        status: 3,
                        type: 1,
                    },
                    {
                        where: {
                            code: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                        },
                    },
                )
            } else if (exOrderTypeCheck.orderName.includes('Professional')) {
                await DB.Users.update(
                    {
                        status: 3,
                        type: 2,
                    },
                    {
                        where: {
                            code: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                        },
                    },
                )
            }
        } else if (exOrderTypeCheck.orderType == 2) {
            const UsersGiftList = await DB.UsersGiftList.create({
                UserCode: Buffer.from(exOrderTypeCheck.UserCode, 'hex'),
                status: '1',
                orderCode: exOrderTypeCheck.orderCode,
                orderName: exOrderTypeCheck.orderName,
                productNumber: exOrderTypeCheck.productNumber,
                buying: exOrderTypeCheck.orderCount,
                sending: 0,
            })
            const exOrderUpdate = await DB.UsersPaymentRequest.update(
                {
                    issuedAt: Date.now(),
                    status: 1,
                    registerCode: 'demo-CARDNO',
                    billingUid: 'demo-DAOUTRX',
                },
                {
                    where: {
                        orderCode: req.query.ORDERNO,
                    },
                },
            ).then((result) => {
                console.log('result', result)
            })
        }
        return res.status(200).send(`<html><body><RESULT>SUCCESS</RESULT></body></html>`)
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

// 결제가 완료되었는지 Cache를 통해서 확인
router.post('/checkout/status', async (req, res) => {
    try {
        const { orderCode } = req.body
        const payResult = Cache.get(orderCode)
        //일반결제 결과 통보 확인
        // debug.axios('checkout-status', payResult)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'CachedBilling status',
            payload: { result: payResult },
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

//사용자의 결제 리스트 가져오기
router.post('/request/list', async (req, res) => {
    try {
        const { UserCode } = req.body
        const exRequest = await DB.UsersPaymentRequest.findAll({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
            },
            // attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Paymetn Request List',
            payload: exRequest,
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

//사용자의 결제 항목 가져오기
router.get('/request/item', async (req, res) => {
    try {
        const UserCode = req.query.UserCode
        const orderCode = req.query.orderCode
        const exRequest = await DB.UsersPaymentRequest.findOne({
            where: {
                UserCode: Buffer.from(UserCode, 'hex'),
                orderCode: orderCode,
            },
            // attributes: { exclude: ['password'] },
            // order: [['createdAt', 'DESC']],
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Paymetn Request Item',
            payload: exRequest,
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
