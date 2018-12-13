const mysql = require('mysql')
const showdown = require('showdown')
const moment = require('moment')

//REQUEST OBJECTS

function bodyBuilder(success, information, answer) {
    return {
        success,
        information,
        answer
    }
}

function success(information = '', answer = {}) {
    return bodyBuilder(true, information, answer)
}

function failure(information = '', answer = {}) {
    return bodyBuilder(false, information, answer)
}

const db = mysql.createPool({
    connectionLimit : 10,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'daboard'
})

//UTILS FUNCTIONS

function specialChars(string) {
    return string.replace(/'/g, '&#39;').replace(/"/g, '&quot;')
}

function readableChars(string) {
    return string.replace(/&#39;/g, '\'').replace(/&quot;/g, '"')
}

function tokenGenerator() {
    return moment(new Date()).format("YYYYMMDDHHmmss")
}

//DATABASE FUNCTIONS

function setTokenForUserID(id, token) {
    return new Promise((resolve) => {
        const query = `UPDATE users SET token = ${ token } WHERE id = '${ id }' LIMIT 1`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function getTokenForUserID(id) {
    return new Promise((resolve) => {
        const query = `SELECT id, username, token FROM users WHERE id = '${ id }'`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function getUserByUsernameAndPassword(username, password) {
    return new Promise((resolve) => {
        const query = `SELECT * FROM users WHERE username = '${ username }' AND password = '${ password }' LIMIT 1`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function getPosts() {
    return new Promise((resolve) => {
        const query = 'SELECT * FROM posts ORDER BY id DESC'
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function addPost(title, content, category, author) {
    const converter = new showdown.Converter()
    return new Promise((resolve) => {
        let today = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        content = specialChars(content)
        const query = `INSERT INTO posts(title, content, html, author, category, creation) VALUES('${ title }', '${ content }', '${ converter.makeHtml(content) }', '${ author }', '${ category }', '${ today }')`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function deletePost(id) {
    return new Promise((resolve) => {
        const query = `DELETE FROM posts WHERE id = ${ id }`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function getPost(id) {
    return new Promise((resolve) => {
        const query = `SELECT * FROM posts WHERE id = ${ id }`
        console.log(query)
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function updatePost(id, title, content, category, author) {
    const converter = new showdown.Converter()
    return new Promise((resolve) => {
        let today = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        content = specialChars(content)
        const query = `UPDATE posts SET title = '${ title }', content = '${ content }', html = '${ converter.makeHtml(content) }', author = '${ author }', category = '${ category }', creation = '${ today }' WHERE id = ${ id }`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function getCategories() {
    return new Promise((resolve) => {
        const query = 'SELECT * FROM categories ORDER BY id ASC'
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

function getTokenAPIForAddress(address, token) {
    return new Promise((resolve) => {
        const query = `SELECT * FROM auth WHERE token = '${ token }' AND addressV4 = '${ address }' OR addressV6 = '${ address }' LIMIT 1`
        db.query(query, function (error, result, fields) {
            resolve(result)
        })
    })
}

async function authenticateRequest(request) {
    const address = request.ip
    const token = request.headers.authorization.split(' ')[1]
    const response = await getTokenAPIForAddress(address, token)
    if (token === response[0].token) {
        return true
    } else {
        return false
    }
}

module.exports = {
    bodyBuilder,
    success,
    failure,
    tokenGenerator,
    getUserByUsernameAndPassword,
    setTokenForUserID,
    getTokenForUserID,
    getPosts,
    addPost,
    deletePost,
    updatePost,
    authenticateRequest,
    getPost,
    getCategories,
    getTokenAPIForAddress
}