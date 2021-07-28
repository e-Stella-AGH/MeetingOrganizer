const request = require("supertest");
const db = require("../db/relations")
let { sequelize } = require("../db/sequelizer")
const { Authorize } = require('../services/jwt_service')
const app = require("../app");

let body = {
    "email": "a@a.pl",
    "password": "test"
}

describe("Test the register user", () => {
    beforeAll(async () => {
        await sequelize.sync()
    })

    test("It should register new user", done => {
        request(app).post("/organizer/register")
            .send(body)
            .then(response => {
                expect(response.statusCode).toBe(201)
                expect(response.body.msg).toBe("Created user")
                done()
            })
    })
    
    test("It should resposne that email is not valid", done => {
        request(app).post("/organizer/register")
            .send({...body, email: "aa"})
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Not valid email")
                done()
            })
    })

    test("It should response that this mail is already used", done => {
        request(app).post("/organizer/register")
            .send(body)
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("This mail is already used")
                done()
            })
    })
})


describe("Test the login user", () => {
 
    test("It return jwt token", done => {
        request(app).post("/organizer/login")
            .send(body)
            .then(response => {
                expect(response.statusCode).toBe(200)
                const token =response.body.msg
                Authorize.verifyToken(token, function(err,user){
                    expect(user.email).toBe(body.email)
                    done()
                })
            })
    })

    test("It should return 400 for bad email", done => {
        request(app).post("/organizer/login")
            .send({...body, email: "b.test"})
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Invalid login or password")
                done()
            })
    })
    test("It should return 400 for bad password", done => {
        request(app).post("/organizer/login")
            .send({...body, password: "b"})
            .then(response => {
                expect(response.statusCode).toBe(400)
                expect(response.body.msg).toBe("Invalid login or password")
                done()
            })
    })
})