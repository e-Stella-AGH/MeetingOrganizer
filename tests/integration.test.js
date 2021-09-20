const request = require("supertest");
const db = require("../db/relations")
let { sequelize } = require("../db/sequelizer")
const { Authorize } = require('../services/jwt_service')
const app = require("../app");
const { RecruitmentServiceUtils } = require("./recruitment_service_integration_utils")
const { Utils } = require("./test_utils");
const { response } = require("../app");
const header = Utils.header

const body = {
    mail: "principus@roma.com",
    password: "a"
}

jest.setTimeout(15_000);

describe("Tests for integration login", () => {
    let jwt

    beforeAll(async () => {
        await sequelize.sync()
    })

    beforeEach(async () => {
        jwt = await RecruitmentServiceUtils.loginUser(body)
    })

    test("It should return 401 for bad token", done => {
        request(app).post("/organizer/login_integration/").set(header, "abcadasd")
            .then(response => {
                expect(response.status).toBe(401)
                expect(response.body.msg).toBe("Integration service response unauthorized")
                done()
            })
    })

    test("It should return 200 for proper token and organizer with that email should exist in db", done => {
        request(app).post("/organizer/login_integration/").set(header, jwt)
            .then(response => {
                expect(response.status).toBe(200)
                expect(response.text).toBe("Success")
                return db.models.Organizer.findAll({ where: { email: body.mail } })
            })
            .then(organizers => {
                expect(organizers.length).toBe(1)
                done()
            })
    })
})

describe("Tests for get email for logged in user", () => {

    let jwt

    beforeAll(async () => {
        jwt = await RecruitmentServiceUtils.loginUser(body)
    })

    test("It should return user mail from token", done => {
        request(app).get("/organizer/").set(header, jwt).then(response => {
            expect(response.status).toBe(200)
            expect(response.body.mail).toBe(body.mail)
            done()
        })
    })
})