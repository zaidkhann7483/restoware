const router = require('express').Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Table = require('../models/Table');

// Helper to generate unique 4-digit ID with retry logic
const generateUniqueOrderId = async () => {
    let orderId;
    let exists;
    do {
        orderId = Math.floor(1000 + Math.random() * 9000).toString();
        exists = await Order.findOne({ orderId });
    } while (exists);
    return orderId;
};

// GET all orders with optional filters (admin)
router.get('/', auth, async (req, res) => {
    try {
        const { status, limit = 50, page = 1, startDate, endDate } = req.query;
        const query = {};
        if (status && ['PAID', 'UNPAID'].includes(status)) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('tableId', 'tableNumber status')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ orders, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET order analytics summary (admin)
router.get('/analytics/summary', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

        const [todayOrders, weekOrders, monthOrders, allOrders, totalPaid, totalUnpaid, topSellingItems] = await Promise.all([
            Order.find({ createdAt: { $gte: today } }).populate('tableId', 'tableNumber'),
            Order.find({ createdAt: { $gte: sevenDaysAgo } }),
            Order.find({ createdAt: { $gte: thirtyDaysAgo } }),
            Order.find().sort({ createdAt: -1 }).limit(10).populate('tableId', 'tableNumber'),
            Order.aggregate([
                { $match: { status: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { status: 'UNPAID' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $unwind: '$items' },
                { $group: { _id: '$items.name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
                { $sort: { totalQty: -1 } },
                { $limit: 10 }
            ])
        ]);

        const todayRevenue = todayOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.totalAmount, 0);
        const weekRevenue = weekOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.totalAmount, 0);
        const monthRevenue = monthOrders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.totalAmount, 0);

        const paidCount = totalPaid[0]?.count || 0;
        const paidTotal = totalPaid[0]?.total || 0;
        const unpaidCount = totalUnpaid[0]?.count || 0;
        const unpaidTotal = totalUnpaid[0]?.total || 0;

        const dailyRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const dayOrders = weekOrders.filter(o => {
                const cd = new Date(o.createdAt);
                return cd >= d && cd < next && o.status === 'PAID';
            });
            const rev = dayOrders.reduce((s, o) => s + o.totalAmount, 0);
            dailyRevenue.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                revenue: rev,
                orders: dayOrders.length
            });
        }

        const dailyOrders = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const dayPaid = weekOrders.filter(o => {
                const cd = new Date(o.createdAt);
                return cd >= d && cd < next && o.status === 'PAID';
            }).length;
            const dayUnpaid = weekOrders.filter(o => {
                const cd = new Date(o.createdAt);
                return cd >= d && cd < next && o.status === 'UNPAID';
            }).length;
            dailyOrders.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                paid: dayPaid,
                unpaid: dayUnpaid
            });
        }

        res.json({
            summary: {
                todayRevenue,
                todayOrders: todayOrders.length,
                weekRevenue,
                weekOrders: weekOrders.length,
                monthRevenue,
                monthOrders: monthOrders.length,
                paidCount,
                paidTotal,
                unpaidCount,
                unpaidTotal,
                totalRevenue: paidTotal + unpaidTotal,
                totalOrders: paidCount + unpaidCount
            },
            dailyRevenue,
            dailyOrders,
            topSellingItems,
            recentOrders: allOrders
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET lookup orders by phone number for a table (public)
router.get('/phone/:phone', async (req, res) => {
    try {
        const phone = req.params.phone.trim();
        if (!phone) return res.json([]);

        const orders = await Order.find({
            customerPhone: phone,
            status: 'UNPAID'
        }).sort({ createdAt: -1 }).limit(5).populate('tableId', 'tableNumber');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET last 5 unpaid orders for a table (public)
router.get('/table/:tableId', async (req, res) => {
    try {
        const orders = await Order.find({
            tableId: req.params.tableId,
            status: 'UNPAID'
        }).sort({ createdAt: -1 }).limit(5);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single order by ID (admin)
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('tableId', 'tableNumber status');
        if (!order) return res.status(404).json({ msg: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Create or Update Order (public)
router.post('/', async (req, res) => {
    const { tableId, items, existingOrderId, customerPhone } = req.body;
    const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    try {
        if (existingOrderId) {
            const updateData = { items, totalAmount };
            if (customerPhone) updateData.customerPhone = customerPhone.trim();
            const updated = await Order.findByIdAndUpdate(existingOrderId, updateData, { new: true });
            return res.json(updated);
        }

        const orderId = await generateUniqueOrderId();
        
        const newOrder = new Order({
            orderId,
            tableId,
            customerPhone: customerPhone ? customerPhone.trim() : '',
            items,
            totalAmount,
            status: 'UNPAID'
        });

        await Table.findByIdAndUpdate(tableId, { status: 'Occupied' });
        const savedOrder = await newOrder.save();
        res.json(savedOrder);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH: Mark as Paid
router.patch('/:id/pay', auth, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: 'PAID' }, { new: true });
        
        const unpaidCount = await Order.countDocuments({ tableId: order.tableId, status: 'UNPAID' });
        if (unpaidCount === 0) {
            await Table.findByIdAndUpdate(order.tableId, { status: 'Available' });
        }
        
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Delete an order (admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        if (order.status === 'UNPAID') {
            const unpaidCount = await Order.countDocuments({ tableId: order.tableId, status: 'UNPAID' });
            if (unpaidCount === 0) {
                await Table.findByIdAndUpdate(order.tableId, { status: 'Available' });
            }
        }

        res.json({ msg: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
