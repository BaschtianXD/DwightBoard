import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { GuildObject, MeGuildResponseBody } from "../../../types/discord-api";
import { protectedProcedure, router } from "../trpc";

export const discordRouter = router({
    guilds: protectedProcedure.query(async (query) => {

        const discordAccount = await query.ctx.prisma.account.findFirstOrThrow({
            where: {
                userId: query.ctx.session.user.id,
                provider: "discord"
            }
        })
        if (!discordAccount.expires_at || discordAccount.expires_at < (Date.now() / 1000)) {
            // refresh access token
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Access token expired" })
        }
        const accessToken = discordAccount.access_token

        const response = await fetch("https://discord.com/api/users/@me/guilds", {
            method: "get",
            headers: new Headers({
                'Authorization': 'Bearer ' + accessToken
            })
        })
        // TODO error handling in case discord api returns an error (Rate Limited, AccessToken expired...)
        const guilds = MeGuildResponseBody.parse(await response.json())
        const ownedGuilds = guilds.filter(guild => guild.owner).map(guild => {
            return {
                id: guild.id,
                name: guild.name,
                icon: guild.icon
            }
        })

        const botResponse = await fetch("https://discord.com/api/users/@me/guilds", {
            method: "get",
            headers: new Headers({
                'Authorization': 'Bot ' + env.DISCORD_BOT_AUTH_TOKEN
            })
        })
        const botGuilds = MeGuildResponseBody.parse(await botResponse.json())

        const intersection = botGuilds.filter(botGuild => ownedGuilds.some(userGuild => botGuild.id === userGuild.id))

        return intersection
    }),
    guild: protectedProcedure.input(z.object({ guildid: z.string().regex(/^\d+$/) })).query(async (query) => {

        if (!prisma) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database Error" })
        }

        const botToken = env.DISCORD_BOT_AUTH_TOKEN

        // fetch guild
        const response = await fetch("https://discord.com/api/guilds/" + query.input.guildid, {
            method: "get",
            headers: new Headers({
                'Authorization': 'Bot ' + botToken
            })
        })
        const json = await response.json()
        const guildParseResult = GuildObject.safeParse(json)
        if (!guildParseResult.success) {
            console.log(guildParseResult.error)
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Discord API Error" })
        }

        const soundCount = await prisma.sound.count({
            where: {
                guildid: guildParseResult.data.id
            }
        })

        const entreeCount = await prisma.entree.count({
            where: {
                guildid: guildParseResult.data.id
            }
        })



        return {
            soundCount,
            entreeCount,
            guild: guildParseResult.data
        }
    }),

    sounds: protectedProcedure.input(z.object({ guildid: z.string().regex(/^\d+$/) })).query(async query => {

        if (!prisma) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database Error" })
        }

        const sounds = await prisma.sound.findMany({
            where: {
                guildid: query.input.guildid
            }
        })
        return { sounds }
    })
})