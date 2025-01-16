const Club = require('../models/Club');
const User = require('../models/User');
const mongoose = require('mongoose');
const clubService = require('../services/clubService');

jest.mock('../models/Club');
jest.mock('../models/User');
