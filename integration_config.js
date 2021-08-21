const { recruitmentServiceVerify } = require('./service_integration/recruitment_service_integration')


const authorizationIntegrations = [recruitmentServiceVerify]

const verifyToken = async (token) => {
    const promises = authorizationIntegrations.map(integration => integration(token))
    const result = await Promise.all(promises)
    return result.length !== 0 ? result[0] : null
}


exports.IntegrationService = verifyToken