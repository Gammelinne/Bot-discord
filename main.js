const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const fetch = require("node-fetch");
const { Client, Intents, MessageEmbed } = require("discord.js");
const discordjs = require("discord.js");
const fs = require("fs");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const {
	Permissions,
	MessageActionRow,
	MessageButton,
	ButtonInteraction,
} = require("discord.js");
const { options, required } = require("nodemon/lib/config");

const url = `https://coronavirusapifr.herokuapp.com/data/live/france`;
const url2 =
	"https://api.nasa.gov/planetary/apod?api_key=IHPFzp4pl4wlJYEAstrfPs12VYjHdKOkbbC8LZxo";

var mystere = Math.floor(Math.random() * 100 + 1);

const commands = [
	{
		name: "interaction",
		description: "permet de voir les interactions (pour les admins)",
	},
	{
		name: "ban",
		description: "permet de ban une personne",
		options: [
			{
				name: "membre",
				description: "le membre à banir",
				required: true,
				type: discordjs.Constants.ApplicationCommandOptionTypes.USER,
			},
			{
				name: "raison",
				description: "?",
				require: false,
				type: discordjs.Constants.ApplicationCommandOptionTypes.STRING,
			},
		],
	},
	{
		name: "github",
		description: "voir mon superbe code !",
	},
	{
		name: "serveur",
		description: "permet de voir pleins de trucs sympas sur le serveur",
	},
	{
		name: "al",
		description: `Joue au juste prix`,
		options: [
			{
				name: "numero",
				description: "choisis ton numéro",
				required: false,
				type: discordjs.Constants.ApplicationCommandOptionTypes.NUMBER,
			},
		],
	},
	{
		name: "pof",
		description: `Permet de jouer au pile ou face`,
	},
	{
		name: "covid",
		description: `Permet de séléctionner une donnée à propos de l'épidémie`,
		options: [
			{
				name: "donnees",
				description: "Choisis la donnee que tu veux connaitre",
				choices: [
					{ name: "décès dû au covid", value: "dc_tot" },
					{ name: "personnes en réanimation", value: "rea" },
					{ name: "personnes hosptalisés", value: "hosp" },
					{ name: "cas confirmés", value: "conf_j1" },
				],
				required: true,
				type: discordjs.Constants.ApplicationCommandOptionTypes.STRING,
			},
		],
	},
	{
		name: "nasa",
		description: "image du jour",
	},
	{
		name: "annonce",
		description: "permet de mettre une annonce (modo uniquement)",
		options: [
			{
				name: "message",
				description: "ecrit ton message ici",
				required: true,
				type: discordjs.Constants.ApplicationCommandOptionTypes.STRING,
			},
		],
	},
];

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(
				"897072394127171614",
				"767420729376768040"
			),
			{ body: commands }
		);

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
})();

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === "github") {
		let gitembed = new MessageEmbed()
			.setColor("#33FF7D")
			.setTitle("Lien juste ici !")
			.setDescription(`Merci !`)
			.setURL("https://github.com/Gammelinne/bot-discord");
		interaction.reply({ embeds: [gitembed] });
	}

	if (interaction.commandName === "interaction") {
		if (
			interaction.member.permissions.has([
				Permissions.FLAGS.ADMINISTRATOR,
			])
		) {
			console.log(interaction);
			await interaction.reply({
				content: "l'interaction à bien fonctionnée",
				ephemeral: true,
			});
		} else {
			interaction.reply("vous n'êtes pas admin");
		}
	}

	if (interaction.commandName === "ban") {
		await interaction.deferReply({ ephemeral: true });

		if (
			interaction.member.permissions.has(
				[Permissions.FLAGS.ADMINISTRATOR] ||
					interaction.member.permissions.has([
						Permissions.FLAGS.BAN_MEMBERS,
					])
			)
		) {
			let victimeuser = interaction.options.getUser("membre");
			let victime = await interaction.guild.members.cache.get(
				victimeuser.id
			);
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId("yes")
						.setLabel("Confirm")
						.setStyle("SUCCESS")
				)
				.addComponents(
					new MessageButton()
						.setCustomId("no")
						.setLabel("Cancel")
						.setStyle("DANGER")
				);
			const embed = new MessageEmbed()
				.setColor("#33FF7D")
				.setTitle("Ban")
				.setDescription(
					`Tu es sur le point de ban ${victimeuser}.\n Es-tu sûr de ce choix ?`
				);

			await interaction.editReply({
				components: [row],
				embeds: [embed],
				ephemeral: true,
			});

			const filter = (i) =>
				(i.customId === "yes" || i.customId === "no") &&
				i.user.id === interaction.member.id;

			const collector =
				interaction.channel.createMessageComponentCollector({
					filter,
					componentType: "BUTTON",
					time: 15000,
					max: 1,
				});

			collector.on("collect", async (i) => {
				await i.deferReply({ ephemeral: true });
				console.log(i.customId);
				if (i.customId == "yes") {
					try {
						if (victime.bannable) {
							await victime.ban({
								days: 7,
								reason: interaction.options.getString("raison"),
							});
							await i.editReply({
								content: `Le membre ${victimeuser} à été bani parce que ${"raison"}`,
							});
						} else {
							i.editReply("Je ne peux pas ban cette personne");
						}
					} catch (error) {
						console.log(error);
						await i.editReply({
							content: `Il y eu une erreur ou vous ne pouvez pas banir ${victimeuser} Voir la console pour plus d'information`,
						});
					}
				} else {
					console.log("no");
					try {
						i.editReply(
							`Vous avez annulé la commande, ${victimeuser} n'a pas été banni`
						);
					} catch {
						console.log(
							"Ca n'a pas marché, ta commande ne marche plus bro"
						);
					}
				}
			});

			collector.on("end", (ButtonInteraction) => {
				interaction.editReply({
					embeds: [embed],
				});
			});
		} else {
			interaction.editReply("vous n'êtes pas admin");
		}
	}

	if (interaction.commandName === "serveur") {
		let pingembed = new MessageEmbed()
			.setColor("#33FF7D")
			.setTitle(`Serveur ${interaction.member.guild.name}`)
			.setThumbnail(interaction.guild.iconURL())
			.setDescription(
				`Salut ${interaction.user.username} !\n
			Il y a actuellement ${interaction.guild.memberCount} personnes formidables ici <3\n 
			le chef de la meute est : <@${interaction.guild.ownerId}>\n
			le ping de kikibot est de ${client.ws.ping} ms (toujours pas plus que celui de la SNCF).\n`
			)
			.setFooter(
				`Kikibot par <@${interaction.guild.ownerId}> Version 1.3.5`
			);
		interaction.reply({ embeds: [pingembed] });
	}
	if (interaction.commandName === "al") {
		var result = interaction.options.getNumber("numero");
		if (result < mystere) {
			interaction.reply(`le bon résultat est supérieur à ${result}`);
		} else if (result > mystere) {
			interaction.reply(`le bon résultat est inferieur à ${result}`);
		} else if (result == mystere) {
			interaction.reply(
				`Bravo ${interaction.user.username} tu as trouvé ${result} qui est le numéro jackpot. Qu'on lui donne un cookie`
			);
			mystere = Math.floor(Math.random() * 100 + 1);
		}
	}
	if (interaction.commandName === "pof") {
		var result = Math.floor(Math.random() * 2);
		if (result == 0) {
			interaction.reply("le resultat est pile");
		} else {
			interaction.reply("le résultat est face");
		}
	}
	if (interaction.commandName === "covid") {
		await interaction.deferReply();
		var getdonnees = interaction.options.getString("donnees");
		var rep = "pas de donnees";
		var val = "";
		await fetch(`${url}`)
			.then((res) => res.json())
			.then((json) => (rep = json[0]));
		switch (interaction.options.getString("donnees")) {
			case "dc_tot":
				val = "décès dû au covid en tout";
				break;
			case "rea":
				val = "personnes en réanimation";
				break;
			case "hosp":
				val = "personnes hospitalisé";
				break;
			case "conf_j1":
				val = "positives au covid en 24h";
				break;
		}
		let covembed = new MessageEmbed()
			.setColor("#33FF7D")
			.setTitle(`Covid-19 en France`)
			.setThumbnail(
				"https://www.src-solution.com/wp-content/uploads/2020/06/img-20200602-163229-543x540-1-543x540.jpg"
			)
			.setFooter("API FranceCovid")
			.setDescription(
				`En France le ${rep.date.toString()}, il y a eu ${rep[
					getdonnees
				].toString()} ${val} `
			);
		interaction.editReply({ embeds: [covembed] });
	}
	if (interaction.commandName === "nasa") {
		await interaction.deferReply();
		var rep = "pas de donnees";
		await fetch(`${url2}`)
			.then((res) => res.json())
			.then((json) => (rep = json));
		let nasembed = new MessageEmbed()
			.setColor("#33FF7D")
			.setTitle(rep.title.toString())
			.setURL(rep.url)
			.setThumbnail(
				"https://www.nasa.gov/sites/default/files/styles/ubernode_alt_horiz/public/thumbnails/image/nasa_town_hall_bam_screen-dr.png"
			)
			.setImage(
				rep.hdurl ||
					"https://media.paperblog.fr/i/430/4303891/belles-photos-lespace-L-uvy4G_.jpeg"
			)
			.setDescription(rep.explanation.toString())
			.setFooter(`API de la Nasa, document du ${rep.date.toString()}`);
		interaction.editReply({ embeds: [nasembed] });
	}
	if (interaction.commandName === "annonce") {
		if (
			interaction.member.permissions.has([
				Permissions.FLAGS.ADMINISTRATOR,
			])
		) {
			let msg = interaction.options.getString("message");
			let annoncebed = new MessageEmbed()
				.setColor("#33FF7D")
				.setTitle("Annonce")
				.setThumbnail(interaction.guild.iconURL())
				.setDescription(msg);
			interaction.reply({ embeds: [annoncebed] });
		} else {
			interaction.reply(
				`Vous n'avez pas les permissions de cette commande`
			);
		}
	}
});

client.login(process.env.TOKEN);
