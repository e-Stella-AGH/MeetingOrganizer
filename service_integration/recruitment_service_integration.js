const fetch = require("node-fetch")

const serviceUrl = "https://recruitment-service-estella.herokuapp.com/"




const recruitmentServiceVeirfy = async (token) => {
    const result = await fetch(serviceUrl + "api/users/loggedInUser", {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'x-jwt': token
        }
    })
    const jsonResult = await result.json()
    return result.status === 200 ? jsonResult.email : null
}

exports.RecruitmentServiceVerify = recruitmentServiceVeirfy