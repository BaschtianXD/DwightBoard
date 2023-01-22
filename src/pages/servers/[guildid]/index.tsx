import { ChartBarIcon, SpeakerWaveIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import NavHeader from "../../../components/NavHeader";
import { pageClasses } from "../../../components/shared";
import { trpc } from "../../../utils/trpc";

const GuildConfigPage: NextPage = () => {
    const router = useRouter()
    const { guildid } = router.query

    const guildQuery = trpc.discord.getGuild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string", staleTime: 1000 * 60 * 5, retry: false })
    const countQuery = trpc.discord.getCountsForGuild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    return (
        <div className={pageClasses}>
            <Head>
                <title>Dwight - {guildQuery.data?.guild.name ?? ""}</title>
            </Head>
            {/* NAV HEADER */}
            <NavHeader elements={[
                { label: "Servers", href: "/servers" },
                { label: "" + guildQuery.data?.guild.name, href: "/servers/" + guildQuery.data?.guild.id, loading: !guildQuery.data }
            ]} />
            {/* PAGE HEADER */}
            <div className="flex flex-row flex-wrap w-full justify-between gap-2">
                {guildQuery.data?.guild.name ?
                    <p className="font-bold text-4xl">{guildQuery.data?.guild.name}</p>
                    :
                    <div className="h-10 w-40 bg-gray-500/50 animate-pulse rounded" />
                }

            </div>
            <div className="flex flex-wrap w-full gap-6">
                <div className="w-full">
                    <p className="text-xl mb-2">Configure</p>
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <Link href={"/servers/" + guildid + "/sounds"} className="w-full h-32 md:w-48 md:h-48 rounded bg-gray-500/40 flex flex-col justify-between p-4">
                            <p className="text-xl">Manage Sounds</p>
                            <div className="flex items-end gap-2">
                                <SpeakerWaveIcon className="h-10 w-10 mb-1" />
                                <p className="text-5xl">{countQuery.data?.soundCount ?? ""}</p>
                            </div>
                        </Link>
                        <Link href={"/servers/" + guildid + "/announcements"} className="w-full h-32 md:w-48 md:h-48 rounded bg-gray-500/40 flex flex-col justify-between p-4">
                            <p className="text-xl">Manage Announcements</p>
                            <div className="flex items-center gap-2">
                                <UsersIcon className="h-10 w-10 mb-1" />
                                <p className="text-5xl">{countQuery.data?.entreeCount ?? ""}</p>
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="w-full">
                    <p className="text-xl mb-2">Statistics</p>
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <Link href={"/servers/" + guildid + "/stats"} className="w-full h-32 md:w-48 md:h-48 rounded bg-gray-500/40 flex flex-col justify-between p-4">
                            <p className="text-xl">Statistics</p>
                            <div className="flex items-end gap-2">
                                <ChartBarIcon className="h-10 w-10 mb-1" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GuildConfigPage
