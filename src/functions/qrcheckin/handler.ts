import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import pool from "@libs/database";
import { queries } from "@libs/queries";
import { getCorsHeaders } from '@libs/cookie';

export const checkin = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const connection = await pool.getConnection();

  try {
    const { eventHash } = JSON.parse(event.body || "{}");
    // console.log("eventbody: " + eventHash);

    // Validate input
    if (!eventHash) {
      console.log("Validate input: " + eventHash);
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin),
        body: JSON.stringify({ message: "Event hash required" }),
      };
    }

    // Update dateTimeAttended if eventHash is valid
    const dateTimeAttended = await connection.execute(
      queries.UPDATE_ATTENDED_DT,
      [eventHash]
    );

    // console.log("DTA: " + JSON.stringify(dateTimeAttended));
    if (dateTimeAttended[0].changedRows > 0) {
      return {
        statusCode: 201,
        headers: getCorsHeaders(event.headers.origin),
        body: JSON.stringify({
          statusCode: "201",
          message: "User attendance taken successfully",
        }),
      };
    } else {
      return {
        statusCode: 411,
        headers: getCorsHeaders(event.headers.origin),
        body: JSON.stringify({
          statusCode: "411",
          message: "User attendance update failed",
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin),
      body: JSON.stringify({
        message: "Internal server error: " + error,
      }),
    };
  } finally {
    connection.release();
  }
};
