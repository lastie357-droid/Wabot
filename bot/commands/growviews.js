const axios = require('axios');

module.exports = {
    name: 'growviews',
    alias: ['growview', 'boostviews', 'viewboost'],
    category: 'pro',
    desc: 'Grow views for Instagram, TikTok, YouTube and other social media platforms',
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            
            if (!args || args.length === 0) {
                return sock.sendMessage(chatId, {
                    text: `📈 *Grow Views Command*\n\nBoost views for your social media content!\n\n*Usage:*\n.growviews <platform> <url>\n\n*Supported Platforms:*\n• ig - Instagram post/reel/story\n• tiktok - TikTok videos\n• yt - YouTube video\n• fb - Facebook video\n\n*Examples:*\n.growviews ig https://instagram.com/p/abc123\n.growviews tiktok https://tiktok.com/@user/video/123\n.growviews yt https://youtube.com/watch?v=abc\n\n*Note:* This is a premium feature.`
                }, { quoted: message });
            }

            const platform = args[0].toLowerCase();
            const url = args.slice(1).join(' ');

            if (!url) {
                return sock.sendMessage(chatId, {
                    text: '❌ Please provide a URL.\n\nExample: .growviews ig https://instagram.com/p/abc123'
                }, { quoted: message });
            }

            let apiUrl = '';
            
            switch (platform) {
                case 'ig':
                case 'instagram':
                    apiUrl = `https://api.siputzx.my.id/api/tools/igview?url=${encodeURIComponent(url)}`;
                    break;
                case 'tiktok':
                case 'tt':
                    apiUrl = `https://api.siputzx.my.id/api/tools/tiktokview?url=${encodeURIComponent(url)}`;
                    break;
                case 'yt':
                case 'youtube':
                    apiUrl = `https://api.siputzx.my.id/api/tools/ytview?url=${encodeURIComponent(url)}`;
                    break;
                case 'fb':
                case 'facebook':
                    apiUrl = `https://api.siputzx.my.id/api/tools/fbview?url=${encodeURIComponent(url)}`;
                    break;
                default:
                    return sock.sendMessage(chatId, {
                        text: `❌ Unsupported platform: ${platform}\n\nSupported: ig, tiktok, yt, fb`
                    }, { quoted: message });
            }

            await sock.sendMessage(chatId, {
                text: `🔄 Processing your view boost request for ${platform}...`
            }, { quoted: message });

            const response = await axios.get(apiUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.data && response.data.status === 200) {
                const result = response.data.data;
                await sock.sendMessage(chatId, {
                    text: `✅ *Views Boosted Successfully!*\n\n📱 *Platform:* ${platform.toUpperCase()}\n🔗 *URL:* ${url}\n📊 *Views:* ${result.views || 'N/A'}\n❤️ *Likes:* ${result.likes || 'N/A'}\n\n*Note:* Results may vary based on platform algorithms.`
                }, { quoted: message });
            } else {
                throw new Error('API returned error');
            }

        } catch (error) {
            console.error('GrowViews Error:', error.message);
            
            let errorMessage = '❌ Failed to boost views.';
            
            if (error.response?.status === 429) {
                errorMessage = '⏰ Rate limit exceeded. Please try again later.';
            } else if (error.response?.status === 400) {
                errorMessage = '❌ Invalid URL or format.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '⏰ Request timeout. Please try again.';
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                errorMessage = '🌐 Network error. Please check your connection.';
            }
            
            await sock.sendMessage(chatId, {
                text: errorMessage
            }, { quoted: message });
        }
    }
};
