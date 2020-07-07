module.exports = (sequelize, DataTypes) => {
  var Resume = sequelize.define('resume', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    education: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resumeUrl: {
      type: DataTypes.STRING,
    },
    resumeHtml: {
      type: DataTypes.TEXT,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
    },
    profileImage: {
      type: DataTypes.STRING,
    },
    lastUpdatedAt: {
      type: DataTypes.DATE,
    },
    desiredStartDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    desiredCountry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    desiredAgeGroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Resume;
};
