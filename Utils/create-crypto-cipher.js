const crypto = require('crypto')
const ENCRYPTION_KEY = process.env.CRT_SECRET
const IV_LENGTH = 16

module.exports = (password) => {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    const encrypted = cipher.update(password)
    return iv.toString('hex') + ':' + Buffer.concat([encrypted, cipher.final()]).toString('hex')
}
