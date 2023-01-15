import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "../../../env/server.mjs";
import { GuildMemberObject, GuildObject, MeGuildResponseBody } from "../../../types/discord-api";
import { protectedProcedure, router } from "../trpc";
import { spawn } from "child_process";

export const discordRouter = router({
    guilds: protectedProcedure.query(async (query) => {

        const discordAccount = await query.ctx.prisma.account.findFirstOrThrow({
            where: {
                userId: query.ctx.session.user.id,
                provider: "discord"
            }
        })
        // TODO reenable this when proper handling is implemented
        // if (!discordAccount.expires_at || discordAccount.expires_at < (Date.now() / 1000)) {
        //     // refresh access token
        //     throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Access token expired" })
        // }
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

        const intersection = ownedGuilds.filter(botGuild => botGuilds.some(userGuild => botGuild.id === userGuild.id))

        const guildMap = new Map<string, { id: string, name: string, icon: string | null }>()
        intersection.reduce((acc, value) => {
            return acc.set(value.id, value)
        }, guildMap)

        return {
            guilds: guildMap
        }
    }),
    getGuild: protectedProcedure.input(z.object({ guildid: z.string().regex(/^\d+$/) })).query(async (query) => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
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

        // await new Promise(r => setTimeout(r, 5000));

        return {
            guild: guildParseResult.data
        }
    }),

    getCountsForGuild: protectedProcedure.input(z.object({ guildid: z.string() })).query(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        const soundCount = await query.ctx.prisma.sound.count({
            where: {
                guildid: query.input.guildid,
                deleted: false
            }
        })

        const entreeCount = await query.ctx.prisma.entree.count({
            where: {
                guildid: query.input.guildid
            }
        })

        const playCount = await query.ctx.prisma.play.count({
            where: {
                sound: {
                    guildid: query.input.guildid,
                    deleted: false
                }
            }
        })

        return {
            soundCount,
            entreeCount,
            playCount
        }
    }),

    getSounds: protectedProcedure.input(z.object({ guildid: z.string().regex(/^\d+$/) })).query(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        const sounds = await query.ctx.prisma.sound.findMany({
            where: {
                guildid: query.input.guildid,
                deleted: false
            },
            select: {
                soundid: true,
                name: true,
                hidden: true,
            }
        })
        // await new Promise(r => setTimeout(r, 5000));
        return { sounds }
    }),

    createSound: protectedProcedure.input(z.object({ name: z.string(), hidden: z.boolean(), guildid: z.string(), fileData: z.string() })).mutation(async query => {

        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        const limitResult = await query.ctx.prisma.limit.findUnique({
            where: {
                guildid: query.input.guildid
            }
        })

        const limit = limitResult?.limit ?? env.DEFAULT_LIMIT

        const soundCount = await query.ctx.prisma.sound.count({
            where: {
                guildid: query.input.guildid,
                deleted: false
            }
        })

        if (soundCount >= limit) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You have reached the limit." })
        }

        const sound = await query.ctx.prisma.sound.create({
            data: {
                name: query.input.name,
                guildid: query.input.guildid,
                hidden: query.input.hidden,
                createdById: query.ctx.session.user.id
            }
        })

        if (env.NODE_ENV === "development") {
            return
        }
        await transcodeSound(sound.soundid, query.input.fileData)

    }),

    updateSound: protectedProcedure.input(z.object({ soundid: z.string(), name: z.string(), hidden: z.boolean() })).mutation(async query => {
        const sound = await query.ctx.prisma.sound.findUnique({
            where: {
                soundid: query.input.soundid
            }
        })

        if (!sound) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "The sound you want to edit does not exist" })
        }

        if (!isGuildOwner(sound.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        await query.ctx.prisma.sound.update({
            where: {
                soundid: query.input.soundid
            },
            data: {
                name: query.input.name,
                hidden: query.input.hidden
            }
        })
    }),

    deleteSound: protectedProcedure.input(z.object({ soundid: z.string() })).mutation(async query => {

        const sound = await query.ctx.prisma.sound.findUnique({
            where: {
                soundid: query.input.soundid
            },
            include: {
                entrees: true
            }
        })

        if (!sound) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "The requested sound does not exist" })
        }

        if (!isGuildOwner(sound.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        await query.ctx.prisma.$transaction([
            query.ctx.prisma.sound.update({
                where: {
                    soundid: query.input.soundid
                },
                data: {
                    deleted: true
                }
            }),
            query.ctx.prisma.entree.deleteMany({
                where: {
                    soundid: sound.soundid
                }
            })
        ])
    }),

    getAnnouncements: protectedProcedure.input(z.object({ guildid: z.string() })).query(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        const announcements = await query.ctx.prisma.entree.findMany({
            where: {
                guildid: query.input.guildid
            },
            include: {
                sound: true
            }
        })
        return {
            announcements: announcements
        }
    }),

    upsertAnnouncement: protectedProcedure.input(z.object({ guildid: z.string(), userid: z.string(), soundid: z.string() })).mutation(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        await query.ctx.prisma.entree.upsert({
            where: {
                guildid_userid: {
                    guildid: query.input.guildid,
                    userid: query.input.userid
                }
            },
            create: {
                soundid: query.input.soundid,
                guildid: query.input.guildid,
                userid: query.input.userid
            },
            update: {
                soundid: query.input.soundid
            }
        })
    }),

    deleteAnnouncement: protectedProcedure.input(z.object({ guildid: z.string(), userid: z.string() })).mutation(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        await query.ctx.prisma.entree.delete({
            where: {
                guildid_userid: {
                    guildid: query.input.guildid,
                    userid: query.input.userid
                }
            }
        })
    }),

    getGuildMembers: protectedProcedure.input(z.object({ guildid: z.string() })).query(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        // TODO handle guilds with more than 1000 users
        const botResponse = await fetch(`https://discord.com/api/guilds/${query.input.guildid}/members?limit=1000`, {
            method: "get",
            headers: new Headers({
                'Authorization': 'Bot ' + env.DISCORD_BOT_AUTH_TOKEN
            })
        })

        const guildMembers = await z.array(GuildMemberObject).parseAsync(await botResponse.json()) // TODO error handling

        const result = guildMembers.filter(member => {
            return member.user.id !== "609005073531404304"
        }).map(member => ({
            userid: member.user.id,
            name: member.nick ?? member.user.username,
            avatar: member.avatar,
            userAvatar: member.user.avatar,
            discriminator: member.user.discriminator
        }))

        return result
    }),

    getLimit: protectedProcedure.input(z.object({ guildid: z.string() })).query(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        const limitResult = await query.ctx.prisma.limit.findUnique({
            where: {
                guildid: query.input.guildid
            }
        })

        const limit = limitResult?.limit ?? env.DEFAULT_LIMIT

        return limit
    }),

    pendingChanges: protectedProcedure.input(z.object({ guildid: z.string() })).query(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        const [lastModified, lastUpdate] = await Promise.all([
            query.ctx.prisma.sound.aggregate({
                _max: {
                    modifiedAt: true
                },
                where: {
                    guildid: query.input.guildid
                }
            }),
            query.ctx.prisma.guildLastUpdate.findUnique({
                where: {
                    guildid: query.input.guildid
                }
            })
        ])

        return {
            pendingChanges: !!(!lastUpdate && lastModified._max.modifiedAt) || (lastUpdate && lastModified._max.modifiedAt && lastUpdate.lastUpdate > lastModified._max.modifiedAt)
        }

    }),

    applyChanges: protectedProcedure.input(z.object({ guildid: z.string() })).mutation(async query => {
        if (!isGuildOwner(query.input.guildid, query.ctx.session.user.discordId)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You are not entitled to access this server." })
        }

        if (env.NODE_ENV === "production" && !env.DWIGHT_CALLBACK) {
            return
        }

        // Check if rebuild is needed
        const [lastModified, lastUpdate] = await Promise.all([
            query.ctx.prisma.sound.aggregate({
                _max: {
                    modifiedAt: true
                },
                where: {
                    guildid: query.input.guildid
                }
            }),
            query.ctx.prisma.guildLastUpdate.findUnique({
                where: {
                    guildid: query.input.guildid
                }
            })
        ])

        if ((lastUpdate && !lastModified._max.modifiedAt) || (lastUpdate && lastModified._max.modifiedAt && lastUpdate.lastUpdate > lastModified._max.modifiedAt)) {
            // no rebuild needed
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No rebuild needed" })
        }

        await fetch(env.DWIGHT_CALLBACK + "/rebuild/" + query.input.guildid)

        await query.ctx.prisma.guildLastUpdate.update({
            where: {
                guildid: query.input.guildid
            },
            data: {
                lastUpdate: new Date()
            }
        })
    })
})

async function transcodeSound(filename: string, datab64: string) {

    return new Promise<void>((resolve, reject) => {
        const buffer = Buffer.from(datab64, "base64")
        const finalFilePath = env.SOUNDS_FOLDER + "/" + filename + ".opus"

        const child = spawn("ffmpeg", ["-f", "mp3", "-i", "pipe:", "-c:a", "libopus", "-b:a", "64k", "-vbr", "on", "-compression_level", "10", "-frame_duration", "60", finalFilePath], {
            stdio: ["pipe", "ignore", process.stderr]
        })

        child.on("exit", (code) => {
            if (code !== 0) {
                reject()
            } else {
                resolve()
            }
        })

        child.stdin.end(buffer)

    })
}

async function isGuildOwner(guildid: string, discordUserId: string) {

    if (!prisma) {
        throw new Error("Internal Server Error")
    }

    const response = await fetch("https://discord.com/api/guilds/" + guildid, {
        method: "get",
        headers: new Headers({
            'Authorization': 'Bot ' + env.DISCORD_BOT_AUTH_TOKEN
        })
    })
    const json = await response.json()
    const guildParseResult = GuildObject.safeParse(json)

    if (guildParseResult.success) {
        return guildParseResult.data.owner_id === discordUserId
    }

    throw new Error("Discord API Error")
}