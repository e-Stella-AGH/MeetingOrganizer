const request = require("supertest");
const db = require("../db/relations")
let { sequelize } = require("../db/sequelizer")
const { Authorize } = require('../services/jwt_service')
const app = require("../app");
const { Utils } = require("./test_utils");
const { response } = require("../app");

let body = {
    "email": "a@a.pl",
    "password": "test"
}

const header = Utils.header

const timeout = 30_000

describe("Test the register user", () => {

    jest.setTimeout(timeout)

    beforeAll(async () => {
        await sequelize.sync()
    })

    test("It should register new user and with second try respond that email is already used", done => {
        request(app).post("/organizer/register")
            .send(body)
            .then(response => {
                expect(response.statusCode).toBe(201)
                expect(response.body.msg).toBe("Created user")
                request(app).post("/organizer/register")
                    .send(body)
                    .then(response => {
                        expect(response.statusCode).toBe(400)
                        expect(response.body.msg).toBe("This mail is already used")
                        done()
                    })
            })
    })

    test("It should resposne that email is not valid", done => {
        request(app).post("/organizer/register")
            .send({ ...body, email: "aa" })
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Not valid email")
                done()
            })
    })

})


describe("Test the login user", () => {

    jest.setTimeout(timeout)

    test("It return jwt token", done => {
        request(app).post("/organizer/login")
            .send(body)
            .then(response => {
                expect(response.statusCode).toBe(200)
                const token = response.body.msg
                Authorize.verifyToken(token, function (err, user) {
                    expect(user.email).toBe(body.email)
                    done()
                })
            })
    })

    test("It should return 400 for bad email", done => {
        request(app).post("/organizer/login")
            .send({ ...body, email: "b.test" })
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Invalid login or password")
                done()
            })
    })
    test("It should return 400 for bad password", done => {
        request(app).post("/organizer/login")
            .send({ ...body, password: "b" })
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Invalid login or password")
                done()
            })
    })
})

describe("Test the endpoints for logged in user", () => {
    let jwt

    jest.setTimeout(timeout)

    beforeAll(async () => {
        jwt = await Utils.loginUser(body)
    })

    test("It should update user", done => {
        const passowrd = "ala"
        request(app).put("/organizer/").set(header, jwt)
            .send({ ...body, password: passowrd })
            .then(response => {
                expect(response.status).toBe(200)
                expect(response.body.msg).toBe("User updated")
                return db.models.Organizer.findAll({ where: { email: body.email } })
            })
            .then(organizers => {
                expect(organizers.length).toBe(1)
                const organizer = organizers[0]
                return Authorize.checkPassword(passowrd, organizer)
            })
            .then(result => {
                expect(result).toBe(true)
                done()
            })
    })
    test("It should send unathorized because of no header", done => {
        const passowrd = "ala"
        request(app).put("/organizer/")
            .send({ ...body, password: passowrd })
            .then(response => {
                expect(response.status).toBe(401)
                expect(response.text).toBe("Unauthorized")
                done()
            })
    })
    test("It should send unathorized because of bad header", done => {
        const passowrd = "ala"
        request(app).put("/organizer/").set(header, "1234141")
            .send({ ...body, password: passowrd })
            .then(response => {
                expect(response.status).toBe(401)
                expect(response.text).toBe("Unauthorized")
                done()
            })
    })

    test("It should send email of logged in user", done => {
        request(app).get("/organizer/")
            .set(header, jwt)
            .then(response => {
                expect(response.status).toBe(200)
                expect(response.body.mail).toBe(body.email)
                done()
            })
    })
})