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
const routeName = 'STORAGE'

/* Upload Path */
const upload = multer({ dest: 'public/uploads/' })

/* Just Routing */
router.post('/', async (req, res) => {
    try {
        const { code, name } = req.body
        res.status(200).json({ code: code, name: name })
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/upload', upload.single('file'), async (req, res) => {
    console.log(req)
    try {
        const { destination, encoding, fieldname, filename, mimetype, originalname, path } =
            req.file
        const { UserCode } = req.body
        const createUploadLogs = await DB.UsersUploadLogs.create({
            UserCode: Buffer.from(UserCode, 'hex'),
            fileCode: filename,
            fileName: originalname,
            filePath: path,
        })
        console.log('createUploadLogs', createUploadLogs)
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Upload Success',
            payload: {
                filename,
                originalname,
            },
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
