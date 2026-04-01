const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    customerPhone: { type: String, default: '' },
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
        name: String,
        price: Number,
        quantity: Number
    }],
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
    createdAt: { type: Date, default: Date.now }
});

// Index for fast phone lookups
OrderSchema.index({ customerPhone: 1, status: 1 });

module.exports = mongoose.model('Order', OrderSchema);