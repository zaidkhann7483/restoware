const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: 'https://via.placeholder.com/150' },
    category: { type: String, default: 'General' }
});

module.exports = mongoose.model('Menu', MenuSchema);