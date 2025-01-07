require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
    dialectOptions: {
      bigNumberStrings: true,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
