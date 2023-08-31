const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const bcrypt = require('bcrypt')

/* Sequelize */
const { Op } = require('sequelize')
const DB = require('../models')

module.exports = () => {
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const Users = await DB.Users.findOne({
                        where: { email },
                    })
                    if (!Users) {
                        return done(null, false, { reason: '존재하지 않는 이메일입니다!' })
                    }

                    const hashedPassword = await bcrypt.hash(password, 12)

                    const result = await bcrypt.compare(password, Users.password)
                    console.log('pwd', password, hashedPassword)
                    if (result) {
                        return done(null, Users)
                    }
                    return done(null, false, { reason: '비밀번호가 틀렸습니다.' })
                } catch (error) {
                    console.error(error)
                    return done(error)
                }
            },
        ),
    )
}
