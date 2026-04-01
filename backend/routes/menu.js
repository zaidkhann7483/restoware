const router = require('express').Router();
const auth = require('../middleware/auth');
const Menu = require('../models/Menu');

// GET all menu items (public)
router.get('/', async (req, res) => {
    try {
        const menu = await Menu.find().sort({ createdAt: -1 });
        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single menu item
router.get('/:id', async (req, res) => {
    try {
        const item = await Menu.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Menu item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - Add new menu item (admin only)
router.post('/', auth, async (req, res) => {
    try {
        const { name, price, image, category } = req.body;

        const newItem = new Menu({
            name,
            price,
            image: image || 'https://via.placeholder.com/150',
            category: category || 'General'
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - Update menu item (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, price, image, category } = req.body;

        const updatedItem = await Menu.findByIdAndUpdate(
            req.params.id,
            { name, price, image, category },
            { new: true, runValidators: true }
        );

        if (!updatedItem) return res.status(404).json({ msg: 'Menu item not found' });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Remove menu item (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const deletedItem = await Menu.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ msg: 'Menu item not found' });
        res.json({ msg: 'Menu item deleted', item: deletedItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;