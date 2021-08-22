const request = require("supertest");
const app = require("../app");


const utils = {
    registerUser: async (body) => await request(app).post("/organizer/register").send(body),

    loginUser: async (body) => {
        const response = await request(app).post("/organizer/login").send(body)
        return response.body.msg
    },

    registerAndLoginUser: async (body) => {
        await utils.registerUser(body)
        return await utils.loginUser(body)
    },
    header: "authorization"
}

exports.Utils = utils