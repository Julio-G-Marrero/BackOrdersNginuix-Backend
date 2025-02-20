const express = require('express');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const router = express.Router();

router.post('/whatsapp', async (req, res) => {
    const { phone, variables } = req.body;

    if (!phone || !variables) {
        return res.status(400).json({ error: 'Número y variables son obligatorios' });
    }

    try {
        const response = await sendWhatsAppMessage(phone, variables);
        res.json({ success: true, sid: response.sid });
    } catch (error) {
        res.status(500).json({ error: 'Error enviando mensaje' });
    }
});

module.exports = router;
