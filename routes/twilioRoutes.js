const express = require("express");
const router = express.Router();
const VoiceResponse = require("twilio").twiml.VoiceResponse;

router.get("/voice-message", (req, res) => {
    const twiml = new VoiceResponse();
    
    twiml.say({
        voice: 'alice',
        language: 'es-MX'
    }, "Hola, este es un mensaje de Back Orders. Se ha confirmado una fecha promesa y cantidad de surtimiento. Por favor, revisa la plataforma y confirma el Back Order.");

    res.type("text/xml");
    res.send(twiml.toString());
});

module.exports = router;
