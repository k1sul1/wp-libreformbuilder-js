export const getEnv = () => process.env.NODE_ENV
export const isProduction = () => getEnv() === 'production'
export const isDevelopment = () => getEnv() === 'development'
