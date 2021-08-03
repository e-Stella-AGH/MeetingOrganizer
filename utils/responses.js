


const createResponse = (msg, status = 200) => {
    return {
        msg: msg,
        status: status
    }
}

exports.Responses = {
    createResponse: createResponse
}