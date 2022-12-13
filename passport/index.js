const passport = require('passport')
//Statagey
const local = require('./local')
const panel = require('./panel')

//Database Models
const DB = require('../models')

module.exports = () => {
    // Using Passport Session
    // session(req.session.passport.user)
    // serializeUser -> Save Session
    // deserializeUser -> Load Session
    passport.serializeUser((user, done) => {
        // console.log('serializeUser', user)
        console.log('serializeUser - email', user.email)
        done(null, user.email)
    })

    passport.deserializeUser(async (email, done) => {
        console.log('deserializeUser', email)
        try {
            // const user = await DB.Users.findOne({
            //     where: { email },
            //     attributes: ['email', 'nickname'],
            // })
            // done(null, user) // req.user
        } catch (error) {
            console.error(error)
            done(error)
        }
    })

    local()
    panel()
}
