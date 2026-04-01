const router = require('express').Router();
const auth = require('../middleware/auth');
const Table = require('../models/Table');

// GET all tables (public)
router.get('/', async (req, res) => {
    try {
        const tables = await Table.find().sort({ tableNumber: 1 });
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single table
router.get('/:id', async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ msg: 'Table not found' });
        res.json(table);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - Add new table (admin only)
router.post('/', auth, async (req, res) => {
    try {
        const { tableNumber } = req.body;

        // Check if table number already exists
        const exists = await Table.findOne({ tableNumber });
        if (exists) return res.status(400).json({ msg: 'Table number already exists' });

        const newTable = new Table({ tableNumber });
        const savedTable = await newTable.save();
        res.status(201).json(savedTable);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - Update table (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const { tableNumber, status } = req.body;

        const updatedTable = await Table.findByIdAndUpdate(
            req.params.id,
            { tableNumber, status },
            { new: true, runValidators: true }
        );

        if (!updatedTable) return res.status(404).json({ msg: 'Table not found' });
        res.json(updatedTable);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Remove table (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if table has unpaid orders before deleting
        const Order = require('../models/Order');
        const unpaidOrders = await Order.countDocuments({ tableId: req.params.id, status: 'UNPAID' });
        if (unpaidOrders > 0) {
            return res.status(400).json({ msg: 'Cannot delete table with active unpaid orders' });
        }

        const deletedTable = await Table.findByIdAndDelete(req.params.id);
        if (!deletedTable) return res.status(404).json({ msg: 'Table not found' });
        res.json({ msg: 'Table deleted', table: deletedTable });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
