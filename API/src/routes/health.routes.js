const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'USOF Backend is running'
    });
});

module.exports = router;
