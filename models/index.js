const { Sequelize, DataTypes } = require('sequelize');

let sequelize;
if (process.env.HEROKU_POSTGRESQL_BROWN_URL) {
  sequelize = new Sequelize(process.env.HEROKU_POSTGRESQL_BROWN_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    port: 5432,
    host: process.env.DATABASE_HOST,
    // logging: true, //false
  });
} else {
  sequelize = new Sequelize('stevenfischer', 'stevenfischer', '', {
    host: 'localhost',
    dialect: 'postgres',
  });
}

const User = require('./User')(sequelize, DataTypes);
const Job = require('./Job')(sequelize, DataTypes);
const Resume = require('./Resume')(sequelize, DataTypes);
const Coupon = require('./Coupon')(sequelize, DataTypes);

// associations

User.hasMany(Job);
Job.belongsTo(User);

User.hasOne(Resume);
Resume.belongsTo(User);

User.sync({ force: false });
Job.sync({ force: false });
Resume.sync({ force: false });
Coupon.sync({ force: false });

module.exports = {
  Sequelize,
  sequelize,
  User,
  Job,
  Resume,
  Coupon,
};
