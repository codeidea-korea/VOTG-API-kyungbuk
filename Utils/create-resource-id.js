const crypto = require('crypto').webcrypto
module.exports = () => {
    const arr = new Uint8Array(8)
    crypto.getRandomValues(arr)
    return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('')
}
