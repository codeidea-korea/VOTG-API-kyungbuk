const http = require('http')
const express = require('express')
/* Default */
const path = require('path')
/* Secure */
const dotenv = require('dotenv')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const hpp = require('hpp')
const helmet = require('helmet')
/* Auth */
const passport = require('passport')
const passportConfig = require('./passport')
/*Debug*/
const debug = require('./debug')
const morgan = require('morgan')
const httpErros = require('http-errors')

/* dotev */
dotenv.config()
/* If you use a name other than '.env' */
/*
require('dotenv').config({
    path: path.join(__dirname, '.env'),
})
/**/

/* Web Socket */
// const webSocket = require('./socket')

/* Router resource */
const RouterIndex = require('./routes/index')
const RouterApi = require('./routes/api')
const RouterAuth = require('./routes/auth')
const RouterImp = require('./routes/imp')

/* Mode & Debug Url Config */
const prodChecker = process.env.NODE_ENV.trim().toLowerCase() === 'production'
if (process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production') {
    process.env.NODE_ENV = 'production'
    process.env.API_URL = process.env.PROD_API_URL
    process.env.FRONT_URL = process.env.PROD_FRONT_URL
} else if (process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'development') {
    process.env.NODE_ENV = 'development'
    process.env.API_URL = process.env.DEV_API_URL
    process.env.FRONT_URL = process.env.DEV_FRONT_URL
} else if (process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'local') {
    process.env.NODE_ENV = 'local'
    process.env.API_URL = process.env.LOCAL_API_URL
    process.env.FRONT_URL = process.env.LOCAL_FRONT_URL
} else {
    process.env.NODE_ENV = 'test'
    process.env.API_URL = process.env.LOCAL_API_URL
    process.env.FRONT_URL = process.env.LOCAL_FRONT_URL
}

debug.log(`NODE_ENV: ${process.env.NODE_ENV}`)
debug.request(`API_URL: ${process.env.API_URL}`)
debug.request(`FRONT_URL: ${process.env.FRONT_URL}`)

/* Start Express */
const app = express()
app.set('PORT', process.env.PORT || 7700)

/* View Engine */
/*/ ESJ
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
/**/
//*/ Default Http
app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // true = using 'qs' module from npm

/* Middleware Setting*/
if (prodChecker) {
    app.enable('trust proxy')
    app.use(morgan('combined'))
    app.use(helmet({ contentSecurityPolicy: false }))
    app.use(hpp())
} else {
    app.use(morgan('dev'))
    app.use(
        cors({
            origin: true,
            credentials: true,
        }),
    )
    // app.use((req, res, next) => {
    //     res.header('Access-Control-Allow-Origin', '*')
    //     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    //     next()
    // })
}
/* Cookie && Session */
app.use(cookieParser(process.env.COOKIE_SECRET))
const sessionOption = {
    resave: false, // 수정된 적 없는 세션이라도 한번 발급된 세션은 저장 허용(=True). 경쟁조건을 일으킬 수 있음
    rolling: false, // 새로고침이 발생할 때마다 세션 refresh(=True, 를 위해서 saveUninitialized=True 가 필요함)
    saveUninitialized: false, // 초기화되지 않은 세션, 생성되었으나 한번도 수정되지 않은 세션을 저장할 것인지 (=True, 이면 아무것도 없는 세션이 강제 저장)
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
    },
}
if (prodChecker) {
    sessionOption.cookie.Secure = true
    sessionOption.cookie.proxy = true
}
app.use(session(sessionOption))

/* Passport Setting */
app.use(passport.initialize())
app.use(passport.session())
passportConfig(passport)

/* API Router Directory */
app.use('/', RouterIndex)
app.use('/api', RouterApi)
app.use('/auth', RouterAuth)
app.use('/imp', RouterImp)

/* Url Router End-point Setting */
app.get('*', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

/* Error Response */
app.use = (req, res, next) => {
    next(createError(404))
    debug.fail('Not Found : 404')
}

/**
 * Create HTTP server.
 */

const server = http.createServer(app)

/**
 * Event listener for HTTP server "error" event.
 */
const onError = (error) => {
    if (error.syscall !== 'listen') {
        throw error
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`)
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`)
            process.exit(1)
            break
        default:
            throw error
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = () => {
    const addr = server.address()
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
    debug.server(`Listening on ${bind}`)
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(app.get('PORT'))
server.timeout = 15000
server.on('error', onError)
server.on('listening', onListening)

/* WebSoket Setting */
// webSocket(server, app)
