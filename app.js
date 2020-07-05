require('dotenv').config();
const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const userRoutes = require('./routes/users/users');
const { search, jobs, stepper, dashboard } = require('./routes/jobs/');
// will turn into named exports
const resume = require('./routes/resume/resume');
const checkout = require('./routes/checkout/checkout');
const baseRoutes = require('./routes');

// const keys = require('./config/keys');

// sequelize.define(() => {});

const app = express();
app.use(
  cors({
    exposedHeaders: 'Auth-Token,Authorization',
  })
);
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use('/api', baseRoutes);
app.use('/api', userRoutes);
app.use('/api', jobs);
app.use('/api', search);
app.use('/api', stepper);
app.use('/api', dashboard);
app.use('/api', resume);
app.use('/api', checkout);

const PORT = process.env.PORT || 5000;

app.listen(PORT);
