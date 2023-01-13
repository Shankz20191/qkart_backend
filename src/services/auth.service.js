const httpStatus = require("http-status");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

/**
 * Login with username and password
 * - Utilize userService method to fetch user object corresponding to the email provided
 * - Use the User schema's "isPasswordMatch" method to check if input password matches the one user registered with (i.e, hash stored in MongoDB)
 * - If user doesn't exist or incorrect password,
 * throw an ApiError with "401 Unauthorized" status code and message, "Incorrect email or password"
 * - Else, return the user object
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const loginUser = await userService.getUserByEmail(email);
  if(loginUser === "No Email") {
    return new Promise((resolve, reject) => {
      reject(new ApiError(httpStatus.UNAUTHORIZED));
    });
  }
  if (loginUser) {
    const passwordMatch = await loginUser.isPasswordMatch(password);
    if (passwordMatch) {
      return new Promise((resolve, reject) => {
        if (passwordMatch) {
          resolve(loginUser);
        } else {
          reject(loginUser);
        }
      });
    } else {
      return new Promise((resolve, reject) => {
        reject(new ApiError(httpStatus.UNAUTHORIZED));
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      reject(new ApiError(httpStatus.UNAUTHORIZED));
    });
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
};
