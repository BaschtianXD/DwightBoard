import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { prisma } from "../../server/db/client";
import { MeGuildResponseBody } from "../../types/discord-api";

type GuildOverviewPageProps = {
    guild: {
        name: string
        sounds: {
            id: string
            name: string
        }[]
    } | undefined

}

export const getServerSideProps: GetServerSideProps<GuildOverviewPageProps> = async (context) => {
    const guildid = context.params?.guildid

    if (!guildid || typeof guildid === "object") {
        return { notFound: true }
    }

    // fetch all guilds the bot is on
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
        method: "get",
        headers: new Headers({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            'Authorization': 'Bot ' + process.env.DISCORD_BOT_AUTH_TOKEN!
        })
    })

    // TODO error handling for when Discord API returns error (rate limit, ...)
    const data = await response.json()
    const guilds = MeGuildResponseBody.parse(data)
    const guild = guilds.find(guild => guild.id === guildid)

    if (!guild) {
        // dwight is not on that server
        return {
            props: {
                guild: undefined
            }

        }
    }

    const sounds = await prisma.sound.findMany({
        where: {
            guildid: guildid
        }
    })

    return {
        props: {
            guild: {
                name: guild.name,
                sounds: sounds.map(sound => {
                    return {
                        id: sound.soundid,
                        name: sound.name
                    }
                })
            }
        }

    }

}


const GuildOverviewPage: NextPage<GuildOverviewPageProps> = (props) => {
    const router = useRouter()
    const { guildid } = router.query
    return (
        <>
            {props.guild ?
                <div>
                    <p>Server: {props.guild.name}</p>
                    <p>Sounds:</p>
                    <ul>
                        {props.guild.sounds.map(sound => { return (<li key={sound.id}>{sound.name}</li>) })}
                    </ul>
                </div>
                :
                <div>
                    <p>Dwight is not on this server. How about you invite him?</p>
                </div>
            }
        </>
    )
}

export default GuildOverviewPage