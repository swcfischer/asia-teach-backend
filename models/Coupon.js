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
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Coupon;
};
