import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { register, login, verify } from "./auth/handler";
import { checkin } from "./qrcheckin/handler";

export { register, login, verify, checkin };

// If you need type definitions, you can also export those:
export type AuthHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;
