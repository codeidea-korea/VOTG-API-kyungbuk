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
const routeName = 'ADM'

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

router.post('/', async (req, res) => {
    try {
        const { code, name } = req.body
        res.status(200).json({ code: code, name: name })
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.patch('/', async (req, res) => {
    try {
        var jsonData = req.body.map((data, index) => {
            var mark_index = `mark_${index}`
            var code_index = `code_${index}`
            var name_index = `name_${index}`
            const { code, name, object } = data
            // console.log(`{ ${code_index} : ${code} , ${name_index} : ${name} }`)
            // var obj = JSON.parse(`{ "${code_index}" : "${code}" , "${name_index}" : "${name}" }`)
            var obj = JSON.parse(`{ 
                "${code_index}" : "${code}" , 
                "${name_index}" : "${name}" , 
                "nullObject" : "${object == null ? 'null' : 'exsist'}" 
            }`)

            return obj
        })
        console.log(jsonData)
        // const sqlQuery = 'CALL setWorker(?,?,?,?)'
        // const sqlQuery = 'INSERT INTO food_category(code, name) value (?,?)'
        // const result = await pool.query(sqlQuery, [code, name])
        // res.status(200).json({"result": "1"})

        res.status(200).json(jsonData)
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.delete('/', async (req, res) => {
    const id = parseInt(req.query.id, 10)
    if (!id) {
        return res.status(400).json({ result: '0', error: error })
    }

    try {
        res.status(200).json({ id: id })
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

/**
 *
 *
 * ACCOUNT DATA LSIT
 *
 *
 */

router.post('/accountList', async (req, res) => {
    try {
        // const { param_code, param_name } = req.params
        const { UserCode } = req.body
        const User = await DB.Users.findOne({
            where: { code: Buffer.from(UserCode, 'hex') },
        })

        // console.log('User', User)
        debug.query('User', User)

        if (User.mode < 2) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'Permissions are not granted.',
                payload: null,
            })
        }

        const UserList = await DB.Users.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'ASC']],
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: UserList,
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

router.delete('/account/delete', async (req, res) => {
    try {
        // const { param_code, param_name } = req.params
        const { UserCode } = req.body
        const User = await DB.Users.findOne({
            where: { code: Buffer.from(UserCode, 'hex') },
        })

        // console.log('User', User)
        debug.query('User', User)

        if (User == null || User == undefined) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'No User',
                payload: null,
            })
        }
        const deleteAccount = await DB.Users.destroy({
            where: { code: Buffer.from(UserCode, 'hex') },
            force: true,
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: deleteAccount,
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

/**
 *
 *
 * Payment DATA LSIT
 *
 *
 */

router.post('/pay/resultList', async (req, res) => {
    try {
        // const { param_code, param_name } = req.params
        const { UserCode } = req.body
        const User = await DB.Users.findOne({
            where: { code: Buffer.from(UserCode, 'hex') },
        })

        // console.log('User', User)
        // debug.query('User', User)

        if (User.mode < 2) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                msg: 'Not Allow.',
                payload: null,
            })
        }

        const resultList = await DB.UsersPaymentRequest.findAll({
            order: [['createdAt', 'ASC']],
        })

        let userList = await Promise.all(
            resultList.map((selectedResult, sIndex) => {
                const User = DB.Users.findOne({
                    where: { code: Buffer.from(selectedResult.UserCode, 'hex') },
                    attributes: { exclude: ['UserCode', 'password'] },
                })
                return User
            }),
        )

        const newList = resultList.map((v, vIndex) => {
            return { ...v, ...userList[vIndex] }
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'ok',
            payload: { UserData: userList, PayResult: resultList },
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

module.exports = router
