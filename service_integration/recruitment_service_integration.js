const fetch = require("node-fetch")

const serviceUrl = "https://recruitment-service-estella.herokuapp.com/"



const recruitmentServiceVeirfy = async (token) => {
    const response = await fetch(serviceUrl + "api/users/loggedInUser", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-jwt': token
        }
    })
    const jsonResponse = await response.json()
    return "statusCodeValue" in jsonResponse ? null : jsonResponse.mail
}

exports.RecruitmentServiceVerify = { verifyToken: recruitmentServiceVeirfy }