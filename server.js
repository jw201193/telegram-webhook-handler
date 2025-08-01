const express = require('express');
const axios = require('axios');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Configuration - YOU NEED TO CHANGE THESE
const CONFIG = {
    // Your n8n workflows webhook URLs
    workflows: [
        'https://bbme.app.n8n.cloud/workflow/pvjJ4pe3VcQjJ4VB',
        'https://bbme.app.n8n.cloud/workflow/DJRgLIm8Jis0HJnz',
        'https://bbme.app.n8n.cloud/workflow/5mYHE48GB4kJLZiC'
        // Add more workflow URLs as needed
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