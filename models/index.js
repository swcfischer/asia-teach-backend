const { Sequelize, DataTypes } = require("sequelize");

let sequelize;
if (process.env.NODE_ENV === "production") {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: true,
    },
    host: process.env.DATABASE_HOST,
  });
} else {
  sequelize = new Sequelize("asiateach", "stevenfischer", "", {
    host: "localhost",
    dialect: "postgres",
  });
}

const User = require("./User")(sequelize, DataTypes);
const Job = require("./Job")(sequelize, DataTypes);
const Resume = require("./Resume")(sequelize, DataTypes);
const Coupon = require("./Coupon")(sequelize, DataTypes);

// associations

User.hasMany(Job);
Job.belongsTo(User);

User.hasOne(Resume);
Resume.belongsTo(User);

User.sync({ force: true });
Job.sync({ force: true });
Resume.sync({ force: true });
Coupon.sync({ force: true });

module.exports = {
  Sequelize,
  sequelize,
  User,
  Job,
  Resume,
  Coupon,
};
