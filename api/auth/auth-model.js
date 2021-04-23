const db = require('../../data/dbConfig')

function findBy(filter) {
    return db('users').where(filter)
}

async function add(user) {
    const [id] = await db('users').insert(user)
    return findBy({ id }).first()
}

module.exports = {
    findBy,
    add
}