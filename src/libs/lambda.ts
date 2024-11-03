import middy from "@middy/core"
import cors from "@middy/http-cors";
import middyJsonBodyParser from "@middy/http-json-body-parser"

export const middyfy = (handler) => {
  return middy(handler)
    .use(middyJsonBodyParser())
    .use(cors({
      credentials: true,
      origin: '*',
      headers: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      exposedHeaders: ['*'],
      maxAge: 86400,
    }));
};
