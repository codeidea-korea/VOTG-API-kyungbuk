const express = require('express')
const router = express.Router()
const cors = require('cors')
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
const routeName = 'BOARD'

/* Upload Path */
const upload = multer({ dest: 'public/uploads/boardImage' })

/* Just Routing */
router.post('/', async (req, res) => {
    try {
        const { code, name } = req.body
        res.status(200).json({ code: code, name: name })
    } catch (error) {
        res.status(400).json({ result: '0', error: error })
    }
})

router.post('/upload', cors(), upload.single('file'), async (req, res) => {
    // console.log(req)
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
                filePath: path.substr(7), // Exclude => public/
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

/**
 *  NOTICE 글쓰기
 */
router.post('/notice/save', async (req, res) => {
    // console.log(req)
    try {
        const { UserCode, BoardCode, title, contents } = req.body
        const createBoardNotice = await DB.BoardNotice.create({
            code: BoardCode,
            title: title,
            contents: contents,
            OwnerCode: Buffer.from(UserCode, 'hex'),
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Notice Save Success',
            payload: {
                createBoardNotice,
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

/**
 *  NOTICE 리스트 받아오기
 */
router.get('/notice/list', async (req, res) => {
    // console.log(req)
    try {
        const exBoardNotice = await DB.BoardNotice.findAll({
            order: [['createdAt', 'DESC']],
        })
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Notice List Success',
            payload: exBoardNotice,
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

/**
 *  NOTICE 글 받아오기
 */
router.get('/notice/code', async (req, res) => {
    // console.log(req)
    try {
        const BoardCode = req.query.BoardCode
        const exBoardNoticeItem = await DB.BoardNotice.findOne({
            where: {
                code: BoardCode,
            },
        })
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Notice Item Get Success',
            payload: exBoardNoticeItem,
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

/**
 *  Learning 글쓰기
 */
router.post('/learn/save', async (req, res) => {
    // console.log(req)
    try {
        const { UserCode, BoardCode, title, contents } = req.body
        const createBoardLearning = await DB.BoardLearning.create({
            code: BoardCode,
            title: title,
            contents: contents,
            OwnerCode: Buffer.from(UserCode, 'hex'),
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Learning Save Success',
            payload: {
                createBoardLearning,
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

/**
 *  Learning 리스트 받아오기
 */
router.get('/learn/list', async (req, res) => {
    // console.log(req)
    try {
        const exBoardLearning = await DB.BoardLearning.findAll({
            order: [['createdAt', 'DESC']],
        })
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Learning List Success',
            payload: exBoardLearning,
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

/**
 *  Learning 글 받아오기
 */
router.get('/learn/code', async (req, res) => {
    // console.log(req)
    try {
        const BoardCode = req.query.BoardCode
        const exBoardLearningItem = await DB.BoardLearning.findOne({
            where: {
                code: BoardCode,
            },
        })
        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Learning Item Get Success',
            payload: exBoardLearningItem,
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

router.post('/learn/delete', async (req, res) => {
    // console.log(req)
    try {
        const UserCode = req.query.UserCode
        const BoardCode = req.query.UserCode
        const createBoardLearning = await DB.BoardLearning.destroy({
            where: { UserCode: UserCode, BoardCode: BoardCode },
        })

        return res.status(200).json({
            isSuccess: true,
            code: 200,
            msg: 'Board Learning Delete Success',
            payload: {
                createBoardLearning,
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
