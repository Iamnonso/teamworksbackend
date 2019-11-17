/* eslint-disable arrow-body-style */
const bcrypt = require('bcrypt');

require('dotenv').config();

const jwt = require('jsonwebtoken');

    /**
     * Hash Password Method
     * @param {string} password
     * @returns {string} returns hashed password
     */
    // eslint-disable-next-line arrow-body-style
    const hashPassword = (password) => {

      const salt = bcrypt.genSaltSync(10);

      const hash = bcrypt.hashSync(password, salt);

      return hash;

    };
    /**
     * comparePassword
     * @param {string} hashPassword
     * @param {string} password
     * @returns {Boolean} return True or False
     */
    const comparePassword = (hashPasswords, password) => {

      return bcrypt.compareSync(password, hashPasswords);

    };
    /**
     * isValidEmail helper method
     * @param {string} email
     * @returns {Boolean} True or False
     */
    const isValidEmail = (email) => {
      return /\S+@\S+\.\S+/.test(email);
    };
    /**
     * Gnerate Token
     * @param {string} id
     * @returns {string} token
     */

    const generateToken = (userId) =>{
      // Generate an auth token for the user
      const token = jwt.sign({ id: userId }, process.env.SECRET);
      return token;
  };

    const generateuserId = () => {
      const x = Math.floor((Math.random() * 100265) + 1);
      return x;
    };

    module.exports = {
 isValidEmail, hashPassword, comparePassword, generateToken, generateuserId,
};