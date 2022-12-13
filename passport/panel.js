const passport = require('passport')
const { Strategy: PanelStrategy } = require('passport-local')
const bcrypt = require('bcrypt')

/* Sequelize */
const { Op } = require('sequelize')
const DB = require('../models')

module.exports = () => {
    passport.use(
        'panel',
        new PanelStrategy(
            {
                usernameField: 'email',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const Panels = await DB.Panels.findOne({
                        where: { email },
                    })
                    if (!Panels) {
                        return done(null, false, { reason: '존재하지 않는 이메일입니다!' })
                    }
                    const result = await bcrypt.compare(password, Panels.password)
                    if (result) {
                        return done(null, Panels)
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
