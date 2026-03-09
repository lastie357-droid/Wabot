const isOwnerOrSudo = require('../lib/isOwner');

module.exports = {
    name: 'growviews',
    alias: ['growviews', 'groupautosave', 'autosave'],
    category: 'pro',
    desc: 'Toggle group auto save - automatically saves contacts who message in groups',
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            const senderId = message.key.participant || message.key.remoteJid;
            
            const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
            if (!message.key.fromMe && !isOwner) {
                return sock.sendMessage(chatId, { text: '❌ Only Owner or Sudo can use this command.' }, { quoted: message });
            }
            
            if (!global.groupautosaveState) {
                global.groupautosaveState = false;
            }
            
            const action = args[0]?.toLowerCase();
            let newState = global.groupautosaveState;
            
            if (action === 'on') {
                newState = true;
            } else if (action === 'off') {
                newState = false;
            } else if (action) {
                return sock.sendMessage(chatId, { text: '❌ Usage: .growviews on / .growviews off' }, { quoted: message });
            }
            
            if (newState !== global.groupautosaveState) {
                global.groupautosaveState = newState;
                
                try {
                    const { Pool } = require('pg');
                    if (process.env.DATABASE_URL) {
                        const pool = new Pool({ 
                            connectionString: process.env.DATABASE_URL, 
                            ssl: { rejectUnauthorized: false } 
                        });
                        const targetId = global.instanceId || process.env.INSTANCE_ID;
                        await pool.query('UPDATE bot_instances SET groupautosave = $1 WHERE id = $2', [newState, targetId]);
                        await pool.end();
                    }
                } catch (e) {
                    console.error('Error saving groupautosave to DB:', e.message);
                }
            }
            
            const statusText = global.groupautosaveState ? 'ON' : 'OFF';
            const statusEmoji = global.groupautosaveState ? '🟢' : '🔴';
            
            await sock.sendMessage(chatId, {
                text: `${statusEmoji} *Group Auto Save* is currently *${statusText}*\n\nWhen enabled, contacts who message in groups will be automatically saved and sent a DM.\n\nUse: .growviews on / .growviews off to toggle`,
                }, { quoted: message });
            
        } catch (error) {
            console.error('GrowViews Error:', error.message);
            await sock.sendMessage(chatId, {
                text: '❌ Error getting group auto save status.'
            }, { quoted: message });
        }
    }
};
