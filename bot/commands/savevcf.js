const { getVCardContactsByBotId, getAllVCardContacts } = require('../lib/chatDb');

async function savecfCommand(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const botName = sock?.user?.name || sock?.user?.pushName || 'Bot';
        const botId = global.instanceId || process.env.INSTANCE_ID;

        console.log('[SAVEVCF] Fetching contacts for bot:', botId);
        
        let contacts;
        if (botId) {
            contacts = await getVCardContactsByBotId(botId);
        } else {
            contacts = await getAllVCardContacts();
        }
        
        console.log('[SAVEVCF] Contacts found:', contacts.length);
        
        if (contacts.length === 0) {
            await sock.sendMessage(chatId, { text: '📇 No contacts saved yet for this bot!' }, { quoted: message });
            return;
        }
        
        let vcfContent = '';
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const name = contact.contact_name || botName;
            const phone = contact.contact_phone;
            
            vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;TYPE=CELL:${phone}
END:VCARD
`;
        }

        const buffer = Buffer.from(vcfContent, 'utf-8');
        
        await sock.sendMessage(chatId, {
            document: buffer,
            fileName: `contacts_${botName.replace(/\s+/g, '_')}.vcf`,
            mimetype: 'text/vcard'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in .savevcf command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error exporting contacts' }, { quoted: message });
    }
}

async function allvcfCommand(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        const botName = sock?.user?.name || sock?.user?.pushName || 'Bot';

        console.log('[ALLVCF] Fetching all contacts from database...');
        const contacts = await getAllVCardContacts();
        console.log('[ALLVCF] Total contacts found:', contacts.length);
        
        if (contacts.length === 0) {
            await sock.sendMessage(chatId, { text: '📇 No contacts saved yet!' }, { quoted: message });
            return;
        }
        
        let vcfContent = '';
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const name = contact.contact_name || 'Unknown';
            const phone = contact.contact_phone;
            
            vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;TYPE=CELL:${phone}
END:VCARD
`;
        }

        const buffer = Buffer.from(vcfContent, 'utf-8');
        
        await sock.sendMessage(chatId, {
            document: buffer,
            fileName: `all_contacts.vcf`,
            mimetype: 'text/vcard'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in .allvcf command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error exporting all contacts' }, { quoted: message });
    }
}

module.exports = { savecfCommand, allvcfCommand };
