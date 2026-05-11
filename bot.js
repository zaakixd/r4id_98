const { Client } = require('discord.js-selfbot-v13');

// ====== CONFIGURATION ======
const PRIMARY_OWNERS = ['1271810399171510372']; // <-- SET YOUR PRIMARY OWNER IDs HERE
let secondaryOwners = [];

// ====== STATE ======
let dmSpamIntervals = {};
let channelSpamIntervals = {};
let fuckvcIntervals = {};
let deleteIntervals = {};

// ====== HELPERS ======
function createEmbed(client, title, description, color = '#5865F2') {
  return {
    title: title,
    description: description,
    color: parseInt(color.replace('#', ''), 16),
    timestamp: new Date(),
    footer: {
      text: client.user?.username || 'Bot'
    }
  };
}

function sendEmbed(channel, embed) {
  channel.send({ embeds: [embed] }).catch(() => {});
}

function replyEmbed(message, title, description, color = '#5865F2') {
  const embed = {
    title: title,
    description: description,
    color: parseInt(color.replace('#', ''), 16),
    timestamp: new Date(),
    footer: {
      text: message.client.user?.username || 'Bot'
    }
  };
  message.channel.send({ embeds: [embed] }).catch(() => {});
}

function isOwner(userId) {
  return PRIMARY_OWNERS.includes(userId) || secondaryOwners.includes(userId);
}

function isPrimaryOwner(userId) {
  return PRIMARY_OWNERS.includes(userId);
}

function parseMultiIds(input) {
  return input.split(',').map(id => id.trim()).filter(id => id.length > 0);
}

// ====== COMMAND HANDLER ======
function handleCommand(message, client) {
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;
  if (message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ====== OWNER COMMANDS (Primary Only) ======
  if (['ownset', 'ownremove', 'listowns'].includes(command)) {
    if (!isPrimaryOwner(message.author.id)) {
      return replyEmbed(message, '❌ Access Denied', 'Only primary owners can use this command!', '#FF0000');
    }
  }
  // ====== ALL OTHER COMMANDS (Any Owner) ======
  else if (!isOwner(message.author.id)) {
    return replyEmbed(message, '❌ Access Denied', 'You are not authorized to use this bot!', '#FF0000');
  }

  switch (command) {
    // ====== !dmspam ======
    case 'dmspam': {
      if (args.length < 4) {
        return replyEmbed(message, '⚠️ Usage Error', '`!dmspam <user_id, user_id> <count> <interval_ms> <content>`', '#FFA500');
      }
      const userIds = parseMultiIds(args[0]);
      const count = parseInt(args[1]);
      const interval = parseInt(args[2]);
      const content = args.slice(3).join(' ');

      if (isNaN(count) || isNaN(interval) || count < 1 || interval < 500) {
        return replyEmbed(message, '⚠️ Invalid Args', 'Count must be > 0 and interval must be >= 500ms', '#FFA500');
      }

      userIds.forEach(userId => {
        if (dmSpamIntervals[userId]) {
          clearInterval(dmSpamIntervals[userId]);
        }
        let sentCount = 0;
        dmSpamIntervals[userId] = setInterval(async () => {
          if (sentCount >= count) {
            clearInterval(dmSpamIntervals[userId]);
            delete dmSpamIntervals[userId];
            return;
          }
          try {
            const user = await client.users.fetch(userId);
            const dm = await user.createDM();
            await dm.send(content);
            sentCount++;
          } catch (e) {
            // user may have DMs closed
          }
        }, interval);
      });

      replyEmbed(
        message,
        '✅ DM Spam Started',
        `**Targets:** ${userIds.join(', ')}\n**Count:** ${count}\n**Interval:** ${interval}ms\n**Content:** ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        '#00FF00'
      );
      break;
    }

    // ====== !dmspamstop ======
    case 'dmspamstop': {
      const keys = Object.keys(dmSpamIntervals);
      if (keys.length === 0) {
        return replyEmbed(message, 'ℹ️ No Active DM Spam', 'There are no DM spam tasks currently running.', '#FFFF00');
      }
      keys.forEach(key => {
        clearInterval(dmSpamIntervals[key]);
        delete dmSpamIntervals[key];
      });
      replyEmbed(message, '🛑 DM Spam Stopped', `Stopped ${keys.length} DM spam task(s).`, '#FF0000');
      break;
    }

    // ====== !spam ======
    case 'spam': {
      if (args.length < 4) {
        return replyEmbed(message, '⚠️ Usage Error', '`!spam <channel_id, channel_id> <count> <interval_ms> <content>`', '#FFA500');
      }
      const channelIds = parseMultiIds(args[0]);
      const count = parseInt(args[1]);
      const interval = parseInt(args[2]);
      const content = args.slice(3).join(' ');

      if (isNaN(count) || isNaN(interval) || count < 1 || interval < 500) {
        return replyEmbed(message, '⚠️ Invalid Args', 'Count must be > 0 and interval must be >= 500ms', '#FFA500');
      }

      channelIds.forEach(channelId => {
        if (channelSpamIntervals[channelId]) {
          clearInterval(channelSpamIntervals[channelId]);
        }
        let sentCount = 0;
        channelSpamIntervals[channelId] = setInterval(async () => {
          if (sentCount >= count) {
            clearInterval(channelSpamIntervals[channelId]);
            delete channelSpamIntervals[channelId];
            return;
          }
          try {
            const channel = await client.channels.fetch(channelId);
            if (channel) {
              await channel.send(content);
              sentCount++;
            }
          } catch (e) {}
        }, interval);
      });

      replyEmbed(
        message,
        '✅ Channel Spam Started',
        `**Channels:** ${channelIds.join(', ')}\n**Count:** ${count}\n**Interval:** ${interval}ms\n**Content:** ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        '#00FF00'
      );
      break;
    }

    // ====== !stopspam ======
    case 'stopspam': {
      const keys = Object.keys(channelSpamIntervals);
      if (keys.length === 0) {
        return replyEmbed(message, 'ℹ️ No Active Channel Spam', 'There are no channel spam tasks currently running.', '#FFFF00');
      }
      keys.forEach(key => {
        clearInterval(channelSpamIntervals[key]);
        delete channelSpamIntervals[key];
      });
      replyEmbed(message, '🛑 Channel Spam Stopped', `Stopped ${keys.length} channel spam task(s).`, '#FF0000');
      break;
    }

    // ====== !helpog ======
    case 'helpog': {
      const helpEmbed = {
        title: '📚 Bot Command List',
        color: parseInt('#5865F2', 16),
        fields: [
          {
            name: '💬 DM Spam',
            value: '`!dmspam <user_id, user_id> <count> <interval_ms> <content>`\n`!dmspamstop`',
            inline: false
          },
          {
            name: '📢 Channel Spam',
            value: '`!spam <channel_id, channel_id> <count> <interval_ms> <content>`\n`!stopspam`',
            inline: false
          },
          {
            name: '🔊 Voice Chat',
            value: '`!fuckvc @user`\n`!fuckvcstop`',
            inline: false
          },
          {
            name: '🛡️ Moderation',
            value: '`!delete @user`\n`!ban @user`\n`!kick @user`\n`!mute <channel_id> <except_id, except_id>`',
            inline: false
          },
          {
            name: '⚙️ Bot Settings',
            value: '`!updatepfp` (attach image)\n`!updatebio <text>`\n`!updatelis <text>`',
            inline: false
          },
          {
            name: '👑 Owner Management',
            value: '`!ownset <user_id>`\n`!ownremove <user_id>`\n`!listowns`',
            inline: false
          }
        ],
        footer: { text: client.user?.username || 'Bot' },
        timestamp: new Date()
      };
      message.channel.send({ embeds: [helpEmbed] }).catch(() => {});
      break;
    }

    // ====== !fuckvc ======
    case 'fuckvc': {
      const target = message.mentions.users.first();
      if (!target) {
        return replyEmbed(message, '⚠️ Usage Error', '`!fuckvc @user` — Mention a user to fuck their VC.', '#FFA500');
      }
      const guild = message.guild;
      if (!guild) {
        return replyEmbed(message, '❌ Error', 'This command must be used in a server.', '#FF0000');
      }

      const member = guild.members.cache.get(target.id);
      if (!member || !member.voice.channel) {
        return replyEmbed(message, '❌ Error', 'That user is not in a voice channel.', '#FF0000');
      }

      if (fuckvcIntervals[target.id]) {
        clearInterval(fuckvcIntervals[target.id]);
      }

      const vcChannels = guild.channels.cache.filter(c => c.type === 'GUILD_VOICE' || c.type === 2);
      
      if (vcChannels.size < 2) {
        return replyEmbed(message, '❌ Error', 'Need at least 2 voice channels for this.', '#FF0000');
      }

      const vcArray = vcChannels.map(c => c);
      let idx = 0;

      fuckvcIntervals[target.id] = setInterval(() => {
        const nextChannel = vcArray[idx % vcArray.length];
        if (nextChannel && member.voice.channel) {
          member.voice.setChannel(nextChannel).catch(() => {});
        }
        idx++;
      }, 500);

      replyEmbed(message, '🔊 VC Fuck Started', `Rapidly moving **${target.tag}** through ${vcArray.length} voice channels.`, '#FF00FF');
      break;
    }

    // ====== !fuckvcstop ======
    case 'fuckvcstop': {
      const keys = Object.keys(fuckvcIntervals);
      if (keys.length === 0) {
        return replyEmbed(message, 'ℹ️ No Active VC Fuck', 'No VC fuck tasks are currently running.', '#FFFF00');
      }
      keys.forEach(key => {
        clearInterval(fuckvcIntervals[key]);
        delete fuckvcIntervals[key];
      });
      replyEmbed(message, '🛑 VC Fuck Stopped', `Stopped ${keys.length} VC fuck task(s).`, '#FF0000');
      break;
    }

    // ====== !delete ======
    case 'delete': {
      const target = message.mentions.users.first();
      if (!target) {
        return replyEmbed(message, '⚠️ Usage Error', '`!delete @user` — Mention a user to delete their messages.', '#FFA500');
      }
      const guild = message.guild;
      if (!guild) {
        return replyEmbed(message, '❌ Error', 'This command must be used in a server.', '#FF0000');
      }

      let deletedCount = 0;
      const channels = guild.channels.cache.filter(c => c.type === 'GUILD_TEXT' || c.type === 0);

      channels.forEach(channel => {
        channel.messages.fetch({ limit: 50 }).then(messages => {
          const userMessages = messages.filter(m => m.author.id === target.id);
          userMessages.forEach(msg => {
            msg.delete().then(() => deletedCount++).catch(() => {});
          });
        }).catch(() => {});
      });

      replyEmbed(message, '🗑️ Deleting Messages', `Deleting recent messages from **${target.tag}**...`, '#FFFF00');
      break;
    }

    // ====== !ban ======
    case 'ban': {
      const target = message.mentions.users.first();
      if (!target) {
        return replyEmbed(message, '⚠️ Usage Error', '`!ban @user` — Mention a user to ban.', '#FFA500');
      }
      const guild = message.guild;
      if (!guild) {
        return replyEmbed(message, '❌ Error', 'This command must be used in a server.', '#FF0000');
      }
      guild.members.ban(target.id).then(() => {
        replyEmbed(message, '🔨 User Banned', `**${target.tag}** has been banned from the server.`, '#FF0000');
      }).catch(err => {
        replyEmbed(message, '❌ Ban Failed', `Could not ban ${target.tag}. Missing permissions or role hierarchy issue.`, '#FF0000');
      });
      break;
    }

    // ====== !kick ======
    case 'kick': {
      const target = message.mentions.users.first();
      if (!target) {
        return replyEmbed(message, '⚠️ Usage Error', '`!kick @user` — Mention a user to kick.', '#FFA500');
      }
      const guild = message.guild;
      if (!guild) {
        return replyEmbed(message, '❌ Error', 'This command must be used in a server.', '#FF0000');
      }
      const member = guild.members.cache.get(target.id);
      if (member) {
        member.kick().then(() => {
          replyEmbed(message, '👢 User Kicked', `**${target.tag}** has been kicked from the server.`, '#FFA500');
        }).catch(err => {
          replyEmbed(message, '❌ Kick Failed', `Could not kick ${target.tag}. Missing permissions or role hierarchy issue.`, '#FF0000');
        });
      } else {
        replyEmbed(message, '❌ Error', 'Could not find that member in the server.', '#FF0000');
      }
      break;
    }

    // ====== !mute ======
    case 'mute': {
      if (args.length < 2) {
        return replyEmbed(message, '⚠️ Usage Error', '`!mute <channel_id> <except_id, except_id>`', '#FFA500');
      }
      const channelId = args[0];
      const exceptIds = parseMultiIds(args[1]);
      const guild = message.guild;
      if (!guild) {
        return replyEmbed(message, '❌ Error', 'This command must be used in a server.', '#FF0000');
      }

      guild.channels.fetch(channelId).then(channel => {
        if (!channel || !(channel.type === 'GUILD_VOICE' || channel.type === 2)) {
          return replyEmbed(message, '❌ Error', 'Invalid voice channel ID.', '#FF0000');
        }
        const members = channel.members;
        let mutedCount = 0;
        members.forEach(member => {
          if (!exceptIds.includes(member.id)) {
            member.voice.setMute(true).then(() => mutedCount++).catch(() => {});
          }
        });
        replyEmbed(
          message,
          '🔇 VC Members Muted',
          `**Channel:** ${channel.name}\n**Muted:** ${mutedCount} members\n**Excepted:** ${exceptIds.length > 0 ? exceptIds.join(', ') : 'None'}`,
          '#9B59B6'
        );
      }).catch(() => {
        replyEmbed(message, '❌ Error', 'Could not find that channel.', '#FF0000');
      });
      break;
    }

    // ====== !updatepfp ======
    case 'updatepfp': {
      if (message.attachments.size === 0) {
        return replyEmbed(message, '⚠️ Usage Error', '`!updatepfp` — Attach an image to set as bot avatar.', '#FFA500');
      }
      const attachment = message.attachments.first();
      if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
        return replyEmbed(message, '❌ Error', 'Attached file must be an image.', '#FF0000');
      }
      client.user.setAvatar(attachment.url).then(() => {
        replyEmbed(message, '🖼️ Avatar Updated', 'Bot profile picture has been changed successfully!', '#00FF00');
      }).catch(err => {
        replyEmbed(message, '❌ Update Failed', 'Could not update avatar. Make sure the image is valid.', '#FF0000');
      });
      break;
    }

    // ====== !updatebio ======
    case 'updatebio': {
      const bio = args.join(' ');
      if (!bio) {
        return replyEmbed(message, '⚠️ Usage Error', '`!updatebio <text>` — Set a new bio/about me.', '#FFA500');
      }
      client.user.setAboutMe(bio).then(() => {
        replyEmbed(message, '📝 Bio Updated', `New bio set successfully!`, '#00FF00');
      }).catch(err => {
        replyEmbed(message, '❌ Update Failed', 'Could not update bio.', '#FF0000');
      });
      break;
    }

    // ====== !updatelis ======
    case 'updatelis': {
      const activity = args.join(' ');
      if (!activity) {
        return replyEmbed(message, '⚠️ Usage Error', '`!updatelis <text>` — Set a new listening status.', '#FFA500');
      }
      client.user.setActivity(activity, { type: 'LISTENING' }).then(() => {
        replyEmbed(message, '🎧 Status Updated', `Now listening to: **${activity}**`, '#00FF00');
      }).catch(err => {
        replyEmbed(message, '❌ Update Failed', 'Could not update listening status.', '#FF0000');
      });
      break;
    }

    // ====== !ownset ======
    case 'ownset': {
      if (!args[0]) {
        return replyEmbed(message, '⚠️ Usage Error', '`!ownset <user_id>`', '#FFA500');
      }
      const userId = args[0];
      if (PRIMARY_OWNERS.includes(userId)) {
        return replyEmbed(message, 'ℹ️ Already Primary', 'That user is already a primary owner.', '#FFFF00');
      }
      if (secondaryOwners.includes(userId)) {
        return replyEmbed(message, 'ℹ️ Already Owner', 'That user is already a secondary owner.', '#FFFF00');
      }
      secondaryOwners.push(userId);
      replyEmbed(message, '👑 Owner Added', `User \`${userId}\` is now a secondary owner.`, '#00FF00');
      break;
    }

    // ====== !ownremove ======
    case 'ownremove': {
      if (!args[0]) {
        return replyEmbed(message, '⚠️ Usage Error', '`!ownremove <user_id>`', '#FFA500');
      }
      const userId = args[0];
      const index = secondaryOwners.indexOf(userId);
      if (index === -1) {
        return replyEmbed(message, '❌ Not Found', 'That user is not a secondary owner.', '#FF0000');
      }
      secondaryOwners.splice(index, 1);
      replyEmbed(message, '👑 Owner Removed', `User \`${userId}\` is no longer a secondary owner.`, '#FF0000');
      break;
    }

    // ====== !listowns ======
    case 'listowns': {
      const allOwners = [...PRIMARY_OWNERS, ...secondaryOwners];
      if (allOwners.length === 0) {
        return replyEmbed(message, 'ℹ️ No Owners', 'No owners configured.', '#FFFF00');
      }
      const primaryField = PRIMARY_OWNERS.map(id => `\`${id}\``).join('\n') || 'None';
      const secondaryField = secondaryOwners.map(id => `\`${id}\``).join('\n') || 'None';

      const embed = {
        title: '👑 Owner List',
        color: parseInt('#5865F2', 16),
        fields: [
          { name: '⭐ Primary Owners', value: primaryField, inline: false },
          { name: '🔹 Secondary Owners', value: secondaryField, inline: false }
        ],
        footer: { text: client.user?.username || 'Bot' },
        timestamp: new Date()
      };
      message.channel.send({ embeds: [embed] }).catch(() => {});
      break;
    }

    default:
      break;
  }
}

// ====== BOT FACTORY ======
function createBot(token) {
  const client = new Client({
    intents: [
      'GUILDS',
      'GUILD_MEMBERS',
      'GUILD_MESSAGES',
      'GUILD_VOICE_STATES',
      'MESSAGE_CONTENT',
      'DIRECT_MESSAGES'
    ]
  });

  client.on('ready', () => {
    console.log(`[+] Bot logged in: ${client.user.tag} (ID: ${client.user.id})`);
  });

  client.on('messageCreate', (message) => {
    handleCommand(message, client);
  });

  client.login(token).catch(err => {
    console.error(`[-] Failed to login bot: ${err.message}`);
  });

  return client;
}

module.exports = { createBot };