const axios = require('axios');

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';

async function sendLineNotification(message) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  
  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }
  
  if (!userId) {
    throw new Error('LINE_USER_ID is not set');
  }
  
  try {
    const response = await axios.post(
      LINE_MESSAGING_API_URL,
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('LINE message sent successfully');
    return response.data;
  } catch (error) {
    console.error('Error sending LINE notification:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendLineNotification };
