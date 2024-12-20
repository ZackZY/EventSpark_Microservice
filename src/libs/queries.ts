export const queries = {
  INSERT_USER: `
    INSERT INTO Users (id, email, password, isAdmin, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `,

  GET_USER_BY_EMAIL: `
    SELECT * FROM Users
    WHERE email = ?
  `,

  UPDATE_ATTENDED_DT: `
    UPDATE EventAttendees
    SET dateTimeAttended = NOW(), status = "attended"
    WHERE eventAttendeeHash = ?
  `,
};
