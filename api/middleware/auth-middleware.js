const Users = require('../auth/auth-model')

function checkPayload(req, res, next) {
    const { username, password } = req.body
    if ( !username || !password 
        || typeof username !== 'string' 
        || typeof password !== 'string' )
    {
        res.status(422).json('username and password required')
    }
    else {
        next()
    }
}

function checkUsernameNotTaken(req, res, next) {
    const { username } = req.body
    Users.findBy({ username })
        .then(([user]) => {
            user 
                ? res.status(422).json('username taken') 
                : next()
        })
        .catch(err => {
            next(err)
        })
}

function checkUserExists(req, res, next) {
    const { username } = req.body
    Users.findBy({ username })
        .then(([user]) => {
            if (user) {
                req.user = user
                next()
            }
            else {
                res.status(401).json('invalid credentials')
            }
        })
        .catch(err => {
            next(err)
        })
}

module.exports = {
    checkPayload,
    checkUsernameNotTaken,
    checkUserExists
}