import { SpeakerWaveIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { NextPage } from "next";
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
            {/* NAV HEADER */}
            <NavHeader elements={[
                { label: "Configuration", href: "/config" },
                { label: "Server: " + guildQuery.data?.guild.name, href: "/config/" + guildQuery.data?.guild.id, loading: !guildQuery.data }
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
                <Link href={"/config/" + guildid + "/sounds"} className="w-full h-32 md:w-48 md:h-48 rounded bg-gray-500/40 flex flex-col justify-between p-4">
                    <p className="text-xl">Manage Sounds</p>
                    <div className="flex items-end gap-2">
                        <SpeakerWaveIcon className="h-10 w-10 mb-1" />
                        <p className="text-5xl">{countQuery.data?.soundCount ?? ""}</p>
                    </div>
                </Link>
                <Link href={"/config/" + guildid + "/announcements"} className="w-full h-32 md:w-48 md:h-48 rounded bg-gray-500/40 flex flex-col justify-between p-4">
                    <p className="text-xl">Manage Announcements</p>
                    <div className="flex items-center gap-2">
                        <UsersIcon className="h-10 w-10 mb-1" />
                        <p className="text-5xl">{countQuery.data?.entreeCount ?? ""}</p>
                    </div>
                </Link>
                {/* <Link href={"/config/" + guildid} className="aspect-square w-full rounded bg-gray-500/40 flex flex-col justify-between p-4">
                    <p className="text-xl">Show Statistics</p>
                    <div className="flex items-center gap-2">
                        <ChartBarIcon className="h-10 w-10 mt-1" />
                    </div>
                </Link> */}
            </div>
        </div>
    )
}

export default GuildConfigPage
