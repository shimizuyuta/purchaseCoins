const axios = require('axios');
const crypto = require('crypto');
const { sendLineNotification } = require('./notifyLine');

const COINCHECK_API_URL = 'https://coincheck.com';
const PURCHASE_AMOUNT = 10000;

function generateSignature(url, body, nonce, secretKey) {
  const message = nonce + url + body;
  return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
}

async function purchaseBtc() {
  const accessKey = process.env.COINCHECK_ACCESS_KEY;
  const secretKey = process.env.COINCHECK_SECRET_KEY;
  
  if (!accessKey || !secretKey) {
    throw new Error('Coincheck API credentials are not set');
  }
  
  const url = '/api/exchange/orders';
  const nonce = Date.now().toString();
  const body = JSON.stringify({
    pair: 'btc_jpy',
    order_type: 'market_buy',
    market_buy_amount: PURCHASE_AMOUNT
  });
  
  const signature = generateSignature(url, body, nonce, secretKey);
  
  try {
    const response = await axios.post(
      `${COINCHECK_API_URL}${url}`,
      JSON.parse(body),
      {
        headers: {
          'ACCESS-KEY': accessKey,
          'ACCESS-NONCE': nonce,
          'ACCESS-SIGNATURE': signature,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Purchase order placed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error placing purchase order:', error.response?.data || error.message);
    throw error;
  }
}

async function executePurchaseWithNotification() {
  try {
    console.log(`Attempting to purchase ¥${PURCHASE_AMOUNT} worth of BTC...`);
    
    const result = await purchaseBtc();
    
    const successMessage = `✅ BTC購入完了\n\n購入金額: ¥${PURCHASE_AMOUNT.toLocaleString()}\n注文ID: ${result.id}\n時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n\n購入が正常に実行されました！`;
    
    await sendLineNotification(successMessage);
    console.log('Purchase completed and notification sent');
    
    return result;
  } catch (error) {
    console.error('Purchase failed:', error.message);
    
    const errorMessage = `❌ BTC購入エラー\n\nエラー: ${error.message}\n時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n\n購入に失敗しました。設定を確認してください。`;
    
    try {
      await sendLineNotification(errorMessage);
    } catch (notifyError) {
      console.error('Failed to send error notification:', notifyError.message);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  executePurchaseWithNotification();
}

module.exports = { purchaseBtc, executePurchaseWithNotification };
