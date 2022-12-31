import { type NextPage } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { prisma } from "../../server/db/client";
import type { GetServerSideProps } from 'next'
import { MeGuildResponseBody } from "../../types/discord-api";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { trpc } from "../../utils/trpc";

type GuildListPageProps = {
    guilds: {
        id: string,
        name: string,
        icon: string | null,
    }[]
}

// export const getServerSideProps: GetServerSideProps<GuildListPageProps> = async (context) => {
//     const sessionData = await getServerAuthSession(context)
//     if (!sessionData || !sessionData.user) {
//         return {
//             redirect: {
//                 destination: "/",
//                 permanent: false,
//             }
//         }
//     }

//     const discordAccount = await prisma.account.findFirstOrThrow({
//         where: {
//             userId: sessionData.user.id,
//             provider: "discord"
//         }
//     })

//     const accessToken = discordAccount.access_token;

//     if (!accessToken) {
//         return {
//             redirect: {
//                 destination: "/",
//                 permanent: false,
//             }
//         }
//     }

//     const response = await fetch("https://discord.com/api/users/@me/guilds", {
//         method: "get",
//         headers: new Headers({
//             'Authorization': 'Bearer ' + accessToken
//         })
//     })
//     // TODO error handling in case discord api returns an error (Rate Limited, AccessToken expired...)
//     const guilds = MeGuildResponseBody.parse(await response.json())
//     const ownedGuilds = guilds.filter(guild => guild.owner).map(guild => {
//         return {
//             id: guild.id,
//             name: guild.name,
//             icon: guild.icon
//         }
//     })

//     return {
//         props: {
//             guilds: ownedGuilds,
//         },
//     }
// }

const GuildListPage: NextPage = () => {
    const { data: sessionData } = useSession();
    const guilds = trpc.discord.guilds.useQuery()
    if (!sessionData || !sessionData.user) {
        return (
            <p>Youre not logged in</p>
        )
    }
    return (
        <div>
            <p>Server:</p>
            {guilds.data ?
                <ul>
                    {guilds.data.map(guild => (<li key={guild.id}><Link href={"/guilds/" + guild.id}>{guild.name}</Link></li>))}
                </ul>
                :
                <p>Loading ...</p>
            }


        </div>
    )
}

export default GuildListPage