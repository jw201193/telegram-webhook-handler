const express = require('express');
const axios = require('axios');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Configuration - YOU NEED TO CHANGE THESE
const CONFIG = {
    // Your n8n workflows webhook URLs
    workflows: [
    'https://bbme.app.n8n.cloud/webhook/07d4ed9e-80d5-4e2e-8c70-9d7a10b1a854', // Jawad Notes
    'https://bbme.app.n8n.cloud/webhook/5e1e5e51-f5cd-4b14-93b6-102614a0db69', // Jawad Expenses  
    'https://bbme.app.n8n.cloud/webhook/8a8349ec-a428-4c5b-a3ed-5d05a779a180'  // Nauman Notes
],
    
    // Port for the server
    port: process.env.PORT || 3000
};

// Main webhook endpoint that Telegram will call
app.post('/telegram-webhook', async (req, res) => {
    const telegramData = req.body;
    
    console.log('Received Telegram webhook:', JSON.stringify(telegramData, null, 2));
    
    // Send the telegram data to all your n8n workflows
    const promises = CONFIG.workflows.map(async (workflowUrl) => {
        try {
            const response = await axios.post(workflowUrl, telegramData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            
            console.log(`Successfully sent to ${workflowUrl}`);
            return { url: workflowUrl, status: 'success' };
        } catch (error) {
            console.error(`Failed to send to ${workflowUrl}:`, error.message);
            return { url: workflowUrl, status: 'error', error: error.message };
        }
    });
    
    // Wait for all requests to complete
    const results = await Promise.all(promises);
    
    // Log results
    console.log('Distribution results:', results);
    
    // Respond to Telegram
    res.status(200).json({ 
        message: 'Webhook received and distributed',
        results: results 
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(CONFIG.port, () => {
    console.log(`Telegram webhook handler running on port ${CONFIG.port}`);
    console.log(`Webhook URL: http://localhost:${CONFIG.port}/telegram-webhook`);
    console.log('Configured to forward to:', CONFIG.workflows);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Server shutting down...');
    process.exit(0);
});
