const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./models/Admin');

const app = express();
app.use(express.json());
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Seed Admin
const seedAdmin = async () => {
    const exists = await Admin.findOne({ email: 'admin@restaurant.com' });
    if (!exists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({ email: 'admin@restaurant.com', password: hashedPassword });
        await admin.save();
        console.log('Default Admin Created: admin@restaurant.com / admin123');
    }
};
seedAdmin();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));