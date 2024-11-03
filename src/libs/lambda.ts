import middy from "@middy/core"
import cors from "@middy/http-cors";
import middyJsonBodyParser from "@middy/http-json-body-parser"

export const middyfy = (handler) => {
  return middy(handler)
    .use(middyJsonBodyParser())
    .use(cors({
      credentials: true,
      headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      origins: [
        process.env.IS_OFFLINE === 'true' 
          ? 'http://localhost:3000' 
          : process.env.FRONTEND_URL
      ]
    }));
};
