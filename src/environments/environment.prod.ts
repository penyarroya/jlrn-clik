//export const environment = { production: true };

export const environment = {
  production: false,
  apiGateway: 'http://localhost:8080',
  healthUrl: 'http://localhost:8080/actuator/health',
  authEndpoint: '/api/auth',
  apiV1: '/api/v1',
  voiceEndpoint: '/api/voice',  // ← CAMBIADO
  enableLogs: true,
  initPageUrl: '/init-page'
};