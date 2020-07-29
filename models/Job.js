module.exports = (sequelize, DataTypes, User) => {
  var Job = sequelize.define('job', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    country: {
      type: DataTypes.ENUM(
        'china',
        'south-korea',
        'taiwan',
        'japan',
        'thailand',
        'vietnam',
        'indonesia'
      ),
    },
    city: {
      type: DataTypes.STRING,
    },
    pay: {
      type: DataTypes.STRING,
    },
    ageGroup: {
      type: DataTypes.ENUM('Children', 'Adolescents', 'University', 'Adults'),
    },
    duration: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 13,
      },
    },
    classSize: {
      type: DataTypes.STRING,
      // could add enum
    },
    startDate: {
      // could add enum
      // for month
      // don't remember if I did a string or num
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
    },
    link: {
      type: DataTypes.STRING,
    },
    thumbnail: {
      type: DataTypes.STRING,
    },
    descriptionHTML: {
      type: DataTypes.TEXT,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    publishedDate: {
      type: DataTypes.DATE,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // photos: [ of strings ]
  });

  return Job;
};
