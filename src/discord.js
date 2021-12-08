'use strict';

const db = require("./db")
const logger = require("./logger")
const logic = require("./logic")
const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions, MessagePayload, MessageButton, MessageActionRow, RoleManager} = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {myConfig} = require("./db");
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS ]);
const client = new Client({intents: intents })

let validatorURL = db.myConfig.VALIDATOR

function createEmbed(traveller, saganism) {
	let url = `${validatorURL}?traveller=${traveller}`
	return new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Please visit ${url}`)
		.setURL(url)
		.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
		.setDescription(saganism)
		.setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');
}

client.on("ready", async () => {
	logger.info(`StarryBot has star(ry)ted.`)
	// We only have to do this once, kept for information only
	/*
	const starryJoin = new SlashCommandBuilder()
		.setName('starry-join')
		.setDescription('Connect your account with Keplr');
	const rest = new REST().setToken(process.env.DISCORD_TOKEN);
	await rest.put(
		Routes.applicationCommands(client.application.id),
		{ body: [starryJoin.toJSON()] },
	);
	 */
});

// When StarryBot joins a new guild, let's create a default role and say hello
client.on("guildCreate", async guild => {
	const systemChannelId = guild.systemChannelId;
	let desiredRoles = ['osmo-hodler', 'juno-hodler'];
	const desiredRolesForMessage = desiredRoles.join('\n- ');
	let systemChannel = await client.channels.fetch(systemChannelId);
	const embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Enable secure slash commands`)
		.setDescription(`StarryBot just joined, and FYI there are two roles:\n- ${desiredRolesForMessage}`)
		.setImage('https://starrybot.xyz/starrybot-slash-commands2.gif')

	const row = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId('slash-commands-enabled')
				.setLabel("I just did it")
				.setStyle('PRIMARY'),
		);

	const msgPayload = MessagePayload.create(client.user, {
		content: 'Hello friends, one more step please.\nSee the GIF below…',
		embeds: [embed],
		components: [row]
	});
	await systemChannel.send(msgPayload);

	const existingObjectRoles = await guild.roles.fetch();

	let existingRoles = {}
	for (let role of existingObjectRoles.values()) {
		console.log('aloha role', role)
		existingRoles[role.name] = role.id
	}

	// See if there are existing roles and only create ones we don't have
	let finalRoleMapping = {}
	for (let role of desiredRoles) {
		// Create role unless it already existed above
		if (existingRoles.hasOwnProperty(role)) {
			finalRoleMapping[role] = existingRoles[role]
		} else {
			const newRole = await guild.roles.create({name: role, position: 0})
			console.log('newRole', newRole)
			finalRoleMapping[role] = newRole.id
		}
	}

	// Add default roles
	await db.rolesSet(guild.id, finalRoleMapping[desiredRoles[0]], desiredRoles[0], 'native', 'osmo')
	await db.rolesSet(guild.id, finalRoleMapping[desiredRoles[1]], desiredRoles[1], 'native', 'juno')
})

// Just for buttons
client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

	// They say they've allowed the bot to add Slash Commands,
	//   let's try to add one for this guild and catch it they've lied to us.
	const starryJoin = new SlashCommandBuilder()
		.setName('starry-join')
		.setDescription('Connect your account with Keplr');
	const rest = new REST().setToken(process.env.DISCORD_TOKEN);
	try {
		await rest.put(
			Routes.applicationGuildCommands(interaction.applicationId, interaction.guildId),
			{ body: [starryJoin.toJSON()] },
		);
	} catch (e) {
		if (e.code === 50001 || e.message === 'Missing Access') {
			// We have a prevaricator
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('slash-commands-enabled')
						.setLabel("I really did it this time")
						.setStyle('PRIMARY'),
				);

			const msgPayload = MessagePayload.create(client.user, {
				content: "That's funny because Discord just told me you didn't. :/\nCan we try that again? (Scroll up to see the animated GIF for instructions)",
				components: [row]
			});
			interaction.reply(msgPayload)
		} else {
			interaction.reply('Something does not seem right, please try adding StarryBot again.')
		}
		return;
	}

	// Slash command should be added successfully, double-check then tell the channel it's ready
	let enabledGuildCommands = await rest.get(
		Routes.applicationGuildCommands(interaction.applicationId, interaction.guildId)
	);
	console.log('enabledGuildCommands', enabledGuildCommands)

	// Ensure (double-check) we have the Slash Command registered,
	//   then publicly tell everyone they can use it
	for (let enabledGuildCommand of enabledGuildCommands) {
		if (enabledGuildCommand.name === 'starry-join') {
			await interaction.reply('Feel free to use the /starry-join command, friends.')
			break;
		}
	}
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		console.log('Interaction is a command')
		if (interaction.commandName === 'starry-join') {
			try {
				let results = await logic.hoistRequest({guildId: interaction.guildId, authorId: interaction.member.user.id})
				if (results.error || !results.traveller || !results.saganism) {
					interaction.channel.send(results.error || "Internal error")
				} else {
					// We reply "privately" instead of sending a DM here
					interaction.reply({embeds:[createEmbed(results.traveller,results.saganism)], ephemeral: true})
				}
			} catch(err) {
				logger.error(err)
				await interaction.channel.send("Internal error adding you") // don't send error itself since it could leak secrets
			}
		}
	} else {
		console.log('Interaction is NOT a command')
	}
});

const login = async () => {
	let token = db.myConfig.DISCORD_TOKEN || process.env.DISCORD_TOKEN;
	const loggedInToken = await client.login(token)
	if (loggedInToken !== token) {
		logger.warn('There might be an issue with the Discord login')
		return false
	} else {
		return true
	}
}

login().then((res) => {
	if (res) {
		logger.log('Connected to Discord')
	} else {
		logger.log('Issue connecting to Discord')
	}
})

module.exports = { client }