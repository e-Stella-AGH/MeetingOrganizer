const fetch = require("node-fetch")

const serviceUrl = "https://recruitment-service-estella.herokuapp.com/"



const login = async (body) => {
    const response = await fetch(serviceUrl + "api/users/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    })
    return response.status === 200 ? response.headers.get("x-auth-token") : null
}

exports.RecruitmentServiceUtils = { loginUser: login }