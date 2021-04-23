const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig')

const user1 = { username: 'user1', password: '12345678'}

beforeAll(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
})

beforeEach(async () => {
    await db('users').truncate()
})

afterAll(async () => {
    db.destroy()
})

describe('authenication endpoints', () => {
    describe('POST /api/auth/register', () => {
        test('responds with 422 and error if missing username or password', async () => {
            let res = await request(server).post('/api/auth/register').send({ username: 'username' })
            expect(res.status).toBe(422)
            expect(res.body).toBe('username and password required')

            res = await request(server).post('/api/auth/register').send({ password: 'password' })
            expect(res.status).toBe(422)
            expect(res.body).toBe('username and password required')
        })
        test('responds with 422 and error if username is taken', async () => {
            await request(server).post('/api/auth/register').send(user1)
            const res = await request(server).post('/api/auth/register').send(user1)

            expect(res.status).toBe(422)
            expect(res.body).toBe('username taken')
        })
        test('responds with 201 and correct user object on success', async () => {
            const res = await request(server).post('/api/auth/register').send(user1)
            expect(res.status).toBe(201)
            expect(res.body).toMatchObject({ username: user1.username, id: 1 })
            expect(res.body.password).toBeDefined()
            expect(res.body.password).not.toEqual(user1.password)
        })
    })
    describe('POST /api/auth/login', () => {
        test('responds with 422 and error if missing username or password', async () => {
            let res = await request(server).post('/api/auth/login').send({ username: user1.username })
            expect(res.status).toBe(422)
            expect(res.body).toBe('username and password required')

            res = await request(server).post('/api/auth/login').send({ password: user1.password })
            expect(res.status).toBe(422)
            expect(res.body).toBe('username and password required')
        })
        test('responds with 401 and error if username does not exist', async () => {
            const res = await request(server).post('/api/auth/login').send(user1)
            expect(res.status).toBe(401)
            expect(res.body).toBe('invalid credentials')
        })
        test('responds with 401 and error if password is invalid', async () => {
            await request(server).post('/api/auth/register').send(user1)
            const res = await request(server).post('/api/auth/login').send({ username: 'user1', password: 'password'})
            expect(res.status).toBe(401)
            expect(res.body).toBe('invalid credentials')
        })
    })
})

describe('jokes endpoint', () => {
    const jokes = require('./jokes/jokes-data')

    describe('GET /api/jokes', () => {
        test('responds with 401 and error if token not attached', async () => {
            const res = await request(server).get('/api/jokes')
            expect(res.status).toBe(401)
            expect(res.body).toBe('token required')
        })
        test('responds with 401 and error if token is invalid', async () => {
            const res = await request(server).get('/api/jokes').set({ authorization: 'bad token' })
            expect(res.status).toBe(401)
            expect(res.body).toBe('token invalid')
        })
        test('responds with 200 and jokes data if token is valid', async () => {
            await request(server).post('/api/auth/register').send(user1)
            let res = await request(server).post('/api/auth/login').send(user1)
            
            res = await request(server).get('/api/jokes').set({ authorization: res.body.token })
            expect(res.status).toBe(200)
            expect(res.body).toEqual(jokes)
        })
    })
})