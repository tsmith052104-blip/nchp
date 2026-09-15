require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const rankRoles = [
  'Colonel','Lieutenant Colonel','Major','Captain','Lieutenant','First Sergeant','Sergeant',
  'Master Trooper','Senior Trooper','Trooper','Probationary Trooper','Trooper Cadet'
];
const extraRoles = ['High Command','Supervisor','FTO','K-9 Unit','Motor Unit','Aviation Unit','Criminal Interdiction','Internal Affairs','LOA','Inactive'];

const categories = [
  ['📌 INFORMATION', ['welcome','announcements','rules-and-regulations','department-information','chain-of-command','rank-structure','roster','server-links']],
  ['📝 RECRUITMENT', ['apply-for-nchp','application-status','interview-information','academy-information']],
  ['🚔 TROOPER OPERATIONS', ['trooper-chat','patrol-announcements','bolo','warrants','arrest-reports','citation-reports','incident-reports','vehicle-impounds','evidence','patrol-logs']],
  ['🎓 TRAINING DIVISION', ['training-announcements','training-material','academy-schedule','ride-along-reports','fto-reports','trooper-evaluations']],
  ['🚨 SPECIAL OPERATIONS', ['special-operations','criminal-interdiction','motor-unit','k9-unit','aviation-unit','speed-enforcement']],
  ['⭐ SUPERVISOR AREA', ['supervisor-chat','promotion-reviews','disciplinary-reports','loa-requests','personnel-changes','command-notices']],
  ['🛡️ HIGH COMMAND', ['high-command-chat','command-meetings','department-changes','personnel-management','internal-affairs']],
  ['💬 COMMUNITY', ['general','media','screenshots','suggestions','off-topic']]
];

const voiceChannels = [
  ['📻 COMMUNICATIONS', ['Briefing Room','Patrol 1','Patrol 2','Traffic Enforcement','Supervisor Channel','Scene 1','Scene 2']],
  ['🎓 TRAINING DIVISION', ['Academy Classroom','FTO Training']],
  ['⭐ SUPERVISOR AREA', ['Supervisor Office']],
  ['🛡️ HIGH COMMAND', ['Command Office']],
  ['💬 COMMUNITY', ['Trooper Lounge']]
];

async function setupGuild(guild) {
  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) throw new Error('The bot needs Administrator permission.');

  const createdRoles = {};
  for (const name of [...rankRoles].reverse()) {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) role = await guild.roles.create({ name, reason: 'NCHP setup' });
    createdRoles[name] = role;
  }
  for (const name of extraRoles) {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) role = await guild.roles.create({ name, reason: 'NCHP setup' });
    createdRoles[name] = role;
  }

  const categoryMap = {};
  for (const [catName, chans] of categories) {
    let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === catName);
    if (!category) category = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory });
    categoryMap[catName] = category;
    for (const name of chans) {
      if (!guild.channels.cache.find(c => c.name === name && c.parentId === category.id)) {
        await guild.channels.create({ name, type: ChannelType.GuildText, parent: category.id });
      }
    }
  }

  for (const [catName, chans] of voiceChannels) {
    let category = categoryMap[catName] || guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === catName);
    if (!category) {
      category = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory });
      categoryMap[catName] = category;
    }
    for (const name of chans) {
      if (!guild.channels.cache.find(c => c.name === name && c.parentId === category.id)) {
        await guild.channels.create({ name, type: ChannelType.GuildVoice, parent: category.id });
      }
    }
  }

  const everyone = guild.roles.everyone;
  const high = categoryMap['🛡️ HIGH COMMAND'];
  const sup = categoryMap['⭐ SUPERVISOR AREA'];
  if (high) await high.permissionOverwrites.set([
    { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: createdRoles['High Command'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
  ]);
  if (sup) await sup.permissionOverwrites.set([
    { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: createdRoles['Supervisor'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
    { id: createdRoles['High Command'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
  ]);

  const roster = guild.channels.cache.find(c => c.name === 'roster');
  if (roster) await roster.send('**NCHP Personnel Roster**\nGoogle Sheet: https://docs.google.com/spreadsheets/d/14cK0ERDAuBAHq92BqDhn2qheXxjH1ydLsgRJi97t6I0/edit');
  const welcome = guild.channels.cache.find(c => c.name === 'welcome');
  if (welcome) await welcome.send('🚔 **Welcome to the North Carolina Highway Patrol**\nProfessionalism • Integrity • Service\n\nUse the department channels above to get started.');
}

const commands = [new SlashCommandBuilder().setName('setup-nchp').setDescription('Build the complete NCHP FiveM Discord server').setDefaultMemberPermissions(PermissionFlagsBits.Administrator).toJSON()];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Registered /setup-nchp');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'setup-nchp') return;
  await interaction.deferReply({ ephemeral: true });
  try {
    await setupGuild(interaction.guild);
    await interaction.editReply('✅ NCHP server setup complete. Roles, categories, channels, voice channels, permissions, and roster link were created.');
  } catch (e) {
    console.error(e);
    await interaction.editReply(`❌ Setup failed: ${e.message}`);
  }
});

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID. Copy .env.example to .env and fill them in.');
  process.exit(1);
}
client.login(TOKEN);
