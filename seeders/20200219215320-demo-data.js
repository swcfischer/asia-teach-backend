'use strict';

const {
  createJobs,
  createResumes,
  createUsers,
  fiftyUserUuids,
  createCouponCodes,
} = require('../util/index');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ids = fiftyUserUuids();
    const jobs = createJobs();
    const users = createUsers(ids);
    const resumes = createResumes(ids);
    const coupons = createCouponCodes();
    await queryInterface.bulkInsert('users', users, {});
    await queryInterface.bulkInsert('resumes', resumes, {});
    await queryInterface.bulkInsert('jobs', jobs, {});
    // await queryInterface.bulkInsert('coupons', coupons, {});
    return;
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  },
};
