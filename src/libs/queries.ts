export const queries = {
  INSERT_USER: `
    INSERT INTO users (id, email, password, isAdmin, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `,
  
  GET_USER_BY_EMAIL: `
    SELECT * FROM Users 
    WHERE email = ?
  `
};
