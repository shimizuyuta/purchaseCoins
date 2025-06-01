const axios = require('axios');
const { sendLineNotification } = require('./notifyLine');

const COINCHECK_TICKER_URL = 'https://coincheck.com/api/ticker';
const PRICE_THRESHOLD = 20000000; // テスト用に閾値を上げて通知をトリガー

async function getBtcPrice() {
  try {
    const response = await axios.get(COINCHECK_TICKER_URL);
    const data = response.data;
    
    if (!data.bid) {
      throw new Error('Invalid response from Coincheck API');
    }
    
    return parseFloat(data.bid);
  } catch (error) {
    console.error('Error fetching BTC price:', error.message);
    throw error;
  }
}

async function checkPriceAndNotify() {
  try {
    const currentPrice = await getBtcPrice();
    console.log(`Current BTC price: ¥${currentPrice.toLocaleString()}`);
    
    if (currentPrice <= PRICE_THRESHOLD) {
      console.log(`Price is below threshold (¥${PRICE_THRESHOLD.toLocaleString()}). Sending notification...`);
      
      const message = `🚨 BTC価格アラート 🚨\n\n現在のBTC価格: ¥${currentPrice.toLocaleString()}\n目標価格: ¥${PRICE_THRESHOLD.toLocaleString()}以下\n\n購入を検討してください！\nGitHub Actionsの手動ワークフローから購入できます。`;
      
      await sendLineNotification(message);
      console.log('LINE notification sent successfully');
      
      return true;
    } else {
      console.log(`Price is above threshold. No notification sent.`);
      return false;
    }
  } catch (error) {
    console.error('Error in price check:', error.message);
    
    const errorMessage = `❌ BTC価格監視エラー\n\nエラー: ${error.message}\n時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
    
    try {
      await sendLineNotification(errorMessage);
    } catch (notifyError) {
      console.error('Failed to send error notification:', notifyError.message);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  checkPriceAndNotify();
}

module.exports = { getBtcPrice, checkPriceAndNotify };
