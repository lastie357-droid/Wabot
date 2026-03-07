const settings = require('../settings');
const { isSudo } = require('./index');

async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    
    // Get the bot's own phone number from the connected socket
    let botPhoneNumber = '';
    if (sock && sock.user) {
        botPhoneNumber = sock.user.id?.split(':')[0]?.split('@')[0] || '';
    }
    
    // Also check settings.ownerNumber as fallback
    const ownerJid = settings.ownerNumber + "@s.whatsapp.net";
    const ownerNumberClean = settings.ownerNumber.split(':')[0].split('@')[0];
    
    // Extract sender's numeric parts
    const senderIdClean = senderId.split(':')[0].split('@')[0];
    const senderLidNumeric = senderId.includes('@lid') ? senderId.split('@')[0].split(':')[0] : '';
    
    
    // Check if sender is the bot itself (owner of this instance)
    if (botPhoneNumber && senderIdClean === botPhoneNumber) {
        return true;
    }
    
    // Direct JID match with settings owner
    if (senderId === ownerJid) {
        return true;
    }
    
    // Check if sender's phone number matches owner number from settings
    if (senderIdClean === ownerNumberClean) {
        return true;
    }
    
    // In groups, check if sender's LID matches bot's LID (owner uses same account as bot)
    if (sock && chatId && chatId.endsWith('@g.us') && senderId.includes('@lid')) {
        try {
            // Get bot's LID numeric
            const botLid = sock.user?.lid || '';
            const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
            
            
            // Check if sender's LID numeric matches bot's LID numeric
            if (senderLidNumeric && botLidNumeric && senderLidNumeric === botLidNumeric) {
                return true;
            }
            
            // Also check participant data for additional matching
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            
            const participant = participants.find(p => {
                const pLid = p.lid || '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : (pLid.includes('@') ? pLid.split('@')[0] : pLid);
                const pId = p.id || '';
                const pIdClean = pId.split(':')[0].split('@')[0];
                
                return (
                    p.lid === senderId || 
                    p.id === senderId ||
                    pLidNumeric === senderLidNumeric ||
                    pIdClean === senderIdClean ||
                    pIdClean === ownerNumberClean ||
                    (botPhoneNumber && pIdClean === botPhoneNumber)
                );
            });
            
            if (participant) {
                const participantId = participant.id || '';
                const participantLid = participant.lid || '';
                const participantIdClean = participantId.split(':')[0].split('@')[0];
                const participantLidNumeric = participantLid.includes(':') ? participantLid.split(':')[0] : (participantLid.includes('@') ? participantLid.split('@')[0] : participantLid);
                
                if (participantId === ownerJid || 
                    participantIdClean === ownerNumberClean ||
                    participantLidNumeric === botLidNumeric ||
                    (botPhoneNumber && participantIdClean === botPhoneNumber)) {
                    return true;
                }
            }
        } catch (e) {
            console.error('❌ [isOwner] Error checking participant data:', e);
        }
    }
    
    // Check if sender ID contains owner number (fallback)
    if (senderId.includes(ownerNumberClean)) {
        return true;
    }
    
    // Check if sender ID contains bot phone number (fallback)
    if (botPhoneNumber && senderId.includes(botPhoneNumber)) {
        return true;
    }
    
    // Check sudo status
    try {
        const isSudoUser = await isSudo(senderId);
        if (isSudoUser) {
            return true;
        }
    } catch (e) {
        console.error('❌ [isOwner] Error checking sudo:', e);
    }
    
    return false;
}

module.exports = isOwnerOrSudo;