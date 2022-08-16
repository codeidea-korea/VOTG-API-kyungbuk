const debug = require('debug')

const log = debug
const server = new debug('app:server')
const request = new debug('app:request')

const query = new debug('debug:query')
const axios = new debug('debug:axios')

const error = new debug('error:server')
const fail = new debug('error:request')

module.exports = { log, server, request, query, axios, error, fail }
