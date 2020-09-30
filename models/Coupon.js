module.exports = (sequelize, DataTypes) => {
  var Coupon = sequelize.define('coupon', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    emailSent: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    company: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Coupon;
};
