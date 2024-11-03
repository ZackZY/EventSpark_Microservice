import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "eventspark-microservice",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-offline"],
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      IS_OFFLINE: '${env:IS_OFFLINE, "false"}',
      DB_HOST: "${self:custom.dbHost}",
      DB_USER: "${self:custom.dbUser}",
      DB_PASSWORD: "${self:custom.dbPassword}",
      DB_NAME: "${self:custom.dbName}",
      DB_PORT: "${self:custom.dbPort}",
      DB_SSL: "${self:custom.dbSsl}",
      COOKIE_DOMAIN: "${self:custom.cookieDomain}",
      FRONTEND_URL: "${self:custom.frontendUrl}",
      JWT_SECRET: "${self:custom.jwtSecret}",
    },
    vpc:
      process.env.IS_OFFLINE === "true"
        ? undefined
        : {
            securityGroupIds: ["${env:SECURITY_GROUP_ID}"],
            subnetIds: ["${env:SUBNET_ID_1}", "${env:SUBNET_ID_2}"],
          },
  },
  // import the function via paths
  functions: {
    register: {
      handler: "src/functions/auth/handler.register",
      events: [
        {
          http: {
            method: "post",
            path: "auth/register",
          },
        },
      ],
    },
    login: {
      handler: "src/functions/auth/handler.login",
      events: [
        {
          http: {
            method: "post",
            path: "auth/login",
          },
        },
      ],
    },
    verify: {
      handler: "src/functions/auth/handler.verify",
      events: [
        {
          http: {
            method: "post",
            path: "auth/verify",
          },
        },
      ],
    },
    logout: {
      handler: "src/functions/auth/handler.logout",
      events: [
        {
          http: {
            method: "post",
            path: "auth/logout",
          },
        },
      ],
    },
    qrcheckin: {
      handler: "src/functions/qrcheckin/handler.checkin",
      events: [
        {
          http: {
            method: "post",
            path: "qrcheckin/checkin",
          },
        },
      ],
    },
  },
  package: { individually: true },
  custom: {
    dbHost: process.env.IS_OFFLINE === "true" ? "localhost" : "${env:DB_HOST}",
    dbUser: process.env.IS_OFFLINE === "true" ? "root" : "${env:DB_USER}",
    dbPassword:
      process.env.IS_OFFLINE === "true" ? "rootpassword" : "${env:DB_PASSWORD}",
    dbName: process.env.IS_OFFLINE === "true" ? "EventSpark" : "${env:DB_NAME}",
    dbPort: process.env.IS_OFFLINE === "true" ? "3306" : "${env:DB_PORT}",
    dbSsl:
      process.env.IS_OFFLINE === "true"
        ? '{"rejectUnauthorized": false}'
        : '{"rejectUnauthorized": true}',
    cookieDomain:
      process.env.IS_OFFLINE === "true" ? "localhost" : "${env:COOKIE_DOMAIN}",
    frontendUrl:
      process.env.IS_OFFLINE === "true"
        ? "http://localhost:3000"
        : "${env:FRONTEND_URL}",
    jwtSecret:
      process.env.IS_OFFLINE === "true"
        ? "local-development-secret"
        : "${env:JWT_SECRET}",
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node20",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
