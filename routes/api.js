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
const routeName = 'API'

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

router.post('/:id', async (req, res) => {
    try {
        // const { param_code, param_name } = req.params
        const { code, name } = req.body
        const id = req.params.id

        // const sqlQuery = 'CALL setWorker(?,?,?,?)'
        // const sqlQuery = 'INSERT INTO food_category(code, name) value (?,?)'
        // const result = await pool.query(sqlQuery, [code, name])
        // res.status(200).json({"result": "1"})

        res.status(200).json({ code: code, name: name, id: id })
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

/* Using Middle-ware isLoggedIn or isNotLoggedIn Routing*/
router.get('/isLogged', isLoggedIn, async (req, res) => {
    try {
        var name = req.query.name

        if (name == null) {
            res.status(200).json(`isLoggedIn /${routeName} : No Data`)
        } else {
            res.status(200).json(`isLoggedIn /${routeName} : ` + name)
        }
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.get('/isLogged', isNotLoggedIn, async (req, res) => {
    try {
        var name = req.query.name

        if (name == null) {
            res.status(200).json(`isNotLoggedIn /${routeName} : No Data`)
        } else {
            res.status(200).json(`isNotLoggedIn /${routeName} : ` + name)
        }
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

module.exports = router
