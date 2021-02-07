const uuidv4 = require('uuid/v4');
const faker = require('faker');
const { jobDescription } = require('../mockData/jobposting');
const { fake } = require('faker');
const moment = require('moment');

function returnRandomPhoto() {
  const numBetween0and2 = returnRandomNumberBetweenZeroAnd(1);

  const photos = ['china-school.jpeg', 'china-school3.jpeg'];
  // const photos = [
  //   'https://asia-teach-header-image-bucket.s3.amazonaws.com/thumbnail-5be35cf1-2d73-486f-8a30-bd539c0cef16',
  //   'https://asia-teach-header-image-bucket.s3.amazonaws.com/thumbnail-a50eb429-d17f-4795-9b44-e8d0eca014b3',
  //   'https://asia-teach-header-image-bucket.s3.amazonaws.com/thumbnail-be32035f-0d0f-4840-996c-b51cd203580b',
  // ];

  return photos[numBetween0and2];
}

function returnRandomNumberBetweenZeroAnd(end) {
  return Math.floor(Math.random() * (end + 1));
}

function returnRandomCountry() {
  const countries = [
    'china',
    'south-korea',
    'taiwan',
    'japan',
    'thailand',
    'vietnam',
    'indonesia',
  ];
  const numbetwen0and6 = returnRandomNumberBetweenZeroAnd(6);
  return countries[numbetwen0and6];
}

function returnRandomNationality() {
  const nationalities = [
    'Australia',
    'United States',
    'Canada',
    'Ireland',
    'United Kingdom',
    'South Africa',
    'New Zealand',
  ];
  const idx = returnRandomNumberBetweenZeroAnd(6);
  return nationalities[idx];
}

function returnRandomEducation() {
  const educations = ['High School', "Bachelor's", 'Masters', 'Phd'];

  const idx = returnRandomNumberBetweenZeroAnd(3);

  return educations[idx];
}

function createJobs(userUuid = '42249c63-e58a-4dc6-a50a-8c433c43540d') {
  /*
    uuid
    companyName
    email
    country
    city
    pay
    ageGroup
    duration
    classSize
    startDate
    phone
    link
    thumbnail
    descriptionHTML

  */
  const jobs = [];
  for (let i = 0; i < 200; i++) {
    jobs.push({
      uuid: uuidv4(),
      companyName: `${capitalize(faker.hacker.adjective())} Elementary`,
      email: faker.internet.email(),
      // add the two new countries
      country: returnRandomCountry(),
      city: faker.address.city(),
      pay: faker.random.number(),
      ageGroup: 'Children',
      duration: 4,
      classSize: '1-10',
      startDate: 'March',
      phone: '952-828-6844',
      link: faker.internet.url(),
      thumbnail: returnRandomPhoto(),
      descriptionHTML: jobDescription,
      userUuid,
      isPublished: true,
      publishedDate: moment().subtract(20, 'days').toDate(),
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [
        'https://images.pexels.com/photos/1586205/pexels-photo-1586205.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/745243/pexels-photo-745243.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/683419/pexels-photo-683419.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/19872/pexels-photo.jpg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
        'https://images.pexels.com/photos/1586205/pexels-photo-1586205.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      ],
    });
  }

  return jobs;
}

function capitalize(word = '') {
  return word[0].toUpperCase() + word.slice(1);
}

function fiftyUserUuids() {
  const userUuids = [];
  for (let i = 0; i < 50; i++) {
    userUuids.push(uuidv4());
  }
  return userUuids;
}

function createUsers(ids) {
  const users = [];
  for (let i = 0; i < 50; i++) {
    users.push({
      uuid: ids[i],
      email: faker.internet.email(),
      password: 'something',
      confirmed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return users;
}

function createResumes(ids) {
  /*
  uuid
  email
  nationality
  education
  name
  experience
  resumeUrl
  resumeHtml
  isPublished
  profileImage
  lastUpdatedAt
  */
  const resumes = [];
  for (let i = 0; i < 50; i++) {
    resumes.push({
      uuid: uuidv4(),
      email: faker.internet.email(),
      nationality: returnRandomNationality(),
      name: 'John Callan',
      education: returnRandomEducation(),
      isPublished: true,
      experience: 'Phd',
      createdAt: new Date(),
      updatedAt: new Date(),
      resumeHtml: '<div>Resume</div>',
      profileImage:
        'https://widgetwhats.com/app/uploads/2019/11/free-profile-photo-whatsapp-4.png',
      lastUpdatedAt: new Date(),
      resumeUrl: 'www.google.com',
      desiredStartDate: 'January',
      desiredCountry: 'Japan',
      desiredAgeGroup: 'College',

      // userUuid: uuidv4(),
      userUuid: ids[i],
    });
  }
  return resumes;
}

const countries = [
  'vietnam',
  'china',
  'south-korea',
  'indonesia',
  'thailand',
  'japan',
  'taiwan',
];

function createCouponCodes() {
  const couponArray = [];

  for (let i = 0; i < 500; i++) {
    couponArray.push({
      uuid: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return couponArray;
}

module.exports = {
  createJobs,
  createResumes,
  createUsers,
  fiftyUserUuids,
  createCouponCodes,
  countries,
};
