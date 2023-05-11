import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import { CHANNEL_LIMIT } from "../../constants";
import { Command } from "../../structures/Command";
import { Channel } from "../../types/Channel";
import { Messages, Reactions } from "../../types/User";

export default new Command({
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View statistics.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("View statistics about a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to get information about.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("server")
        .setDescription("View statistics about this server.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bot")
        .setDescription("View statistics related to this bot.")
    ),
  /**
   * @param {{ client: import('discord.js').Client, interaction: import('discord.js').ChatInputCommandInteraction }} options
   */
  run: async ({ client, interaction }) => {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "user":
        {
          const user = interaction.options.getUser("user") || interaction.user;
          if (user.bot)
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setDescription("Bots are not tracked.")
                  .setColor("Red"),
              ],
            });

          let serverMessages: Messages | null = null;
          let globalMessages: Messages[] | null = null;

          let serverReactions: Reactions | null = null;
          let globalReactions: Reactions[] | null = null;
          try {
            serverMessages = require(`../../../data/messages/${user.id}-${interaction.guild.id}.json`);
          } catch {}
          try {
            serverReactions = require(`../../../data/reactions/${user.id}-${interaction.guild.id}.json`);
          } catch {}
          try {
            globalMessages = fs
              .readdirSync("./data/messages")
              .filter((file) => file.startsWith(user.id))
              .map((user) => require(`../../../data/messages/${user}`));
          } catch {}
          try {
            globalReactions = fs
              .readdirSync("./data/reactions")
              .filter((file) => file.startsWith(user.id))
              .map((user) => require(`../../../data/reactions/${user}`));
          } catch {}

          interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: user.tag,
                  iconURL: user.displayAvatarURL(),
                })
                .setDescription(
                  [
                    "__Global__",
                    `**Messages**: ${globalMessages
                      ?.map((data) => data?.messages || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    `**Characters**: ${globalMessages
                      ?.map((data) => data?.characters || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    `**Reactions**: ${globalReactions
                      ?.map((data) => data?.reactions || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    "",
                    "__Server__",
                    `**Messages**: ${
                      serverMessages?.messages.toLocaleString() || 0
                    }`,
                    `**Characters**: ${
                      serverMessages?.characters.toLocaleString() || 0
                    }`,
                    `**Reactions**: ${
                      serverReactions?.reactions.toLocaleString() || 0
                    }`,
                  ].join("\n")
                )
                .setColor("White"),
            ],
          });
        }
        break;
      case "server":
        {
          const serverMessages = fs
            .readdirSync("./data/messages")
            .filter((file) =>
              file.split(".json")[0].endsWith(interaction.guild.id)
            )
            .map((user) => require(`../../../data/messages/${user}`));
          const serverReactions = fs
            .readdirSync("./data/reactions")
            .filter((file) =>
              file.split(".json")[0].endsWith(interaction.guild.id)
            )
            .map((user) => require(`../../../data/reactions/${user}`));
            const serverChannels = fs.readdirSync("./data/channels").filter((file) => (require(`../../../data/channels/${file}`) as Channel).guilds.find((x) => x.id === interaction.guild.id))

          interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: interaction.guild.name,
                  iconURL: interaction.guild.iconURL() ?? undefined,
                })
                .setDescription(
                  [
                    `**Messages**: ${serverMessages
                      .map((data) => data?.messages || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    `**Characters**: ${serverMessages
                      .map((data) => data?.characters || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    `**Reactions**: ${serverReactions
                      .map((data) => data?.reactions || 0)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    `**Channels watching**: ${serverChannels.length.toLocaleString()}/${CHANNEL_LIMIT.toLocaleString()}`
                  ].join("\n")
                )
                .setColor("White"),
            ],
          });
        }
        break;
      case "bot":
        {
          const allUsers = fs.readdirSync("./data/messages").map((user) => ({
            userID: user.split(".json")[0].split("-")[0],
            ...require(`../../../data/messages/${user}`),
          }));
          const filteredUsers: string[] = [];
          allUsers.forEach((user) => {
            if (filteredUsers.find((x) => x === user.userID)) return;
            else filteredUsers.push(user.userID);
          });

          const allMessages = fs.readdirSync("./data/messages").map((user) => ({
            userID: user.split(".json")[0],
            ...require(`../../../data/messages/${user}`),
          }));

          const globalMessages = allMessages
            .map((user) => user?.messages || 0)
            .reduce((a, b) => a + b, 0);
          const globalCharacters = allMessages
            .map((user) => user?.characters || 0)
            .reduce((a, b) => a + b, 0);

          const allReactions = fs
            .readdirSync("./data/reactions")
            .map((user) => require(`../../../data/reactions/${user}`))
            .map((user) => user?.reactions || 0);

          interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: client.user.username,
                  iconURL: client.user.displayAvatarURL(),
                })
                .setDescription(
                  [
                    `**Servers**: ${client.guilds.cache.size.toLocaleString()}`,
                    `**Users**: ${client.guilds.cache
                      .map((guild) => guild.memberCount)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()} (${filteredUsers.length.toLocaleString()})`,
                    `**Messages**: ${globalMessages.toLocaleString()}`,
                    `**Characters**: ${globalCharacters.toLocaleString()}`,
                    `**Reactions**: ${allReactions
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}`,
                    `**Channels watching**: ${fs
                      .readdirSync("./data/channels")
                      .length.toLocaleString()}`,
                  ].join("\n")
                )
                .setColor("White"),
            ],
          });
        }
        break;
    }
  },
});
