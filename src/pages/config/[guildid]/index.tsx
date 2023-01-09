import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { ChartBarIcon, MusicalNoteIcon, SpeakerWaveIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { pageClasses } from "../../../components/shared";
import { trpc } from "../../../utils/trpc";

const GuildConfigPage: NextPage = () => {
    const router = useRouter()
    const { guildid } = router.query

    const guildQuery = trpc.discord.getGuild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    const countQuery = trpc.discord.getCountsForGuild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    return (
        <div className={pageClasses}>
            {/* NAV HEADER */}
            <div className="flex gap-2 items-center m-2">
                <ChevronRightIcon className="h-4" />
                <Link href="/config">Config</Link>
                <ChevronRightIcon className="h-4" />
                <Link href={"/config/" + guildid}>Server: {guildQuery.data?.guild.name}</Link>
            </div>
            {/* PAGE HEADER */}
            <div className="flex flex-row flex-wrap w-full justify-between gap-2">
                <p className="font-bold text-4xl">{guildQuery.data?.guild.name}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-6 w-full gap-6">
                <Link href={"/config/" + guildid + "/sounds"} className="aspect-square w-full rounded bg-gray-500/40 flex flex-col justify-between p-4">
                    <p className="text-xl">Sounds</p>
                    <div className="flex items-center gap-2">
                        <SpeakerWaveIcon className="h-10 w-10 mt-1" />
                        <p className="text-5xl">{countQuery.data?.soundCount ?? ""}</p>
                    </div>
                </Link>
                <Link href={"/config/" + guildid + "/announcements"} className="aspect-square w-full rounded bg-gray-500/40 flex flex-col justify-between p-4">
                    <p className="text-xl">Announcements</p>
                    <div className="flex items-center gap-2">
                        <UsersIcon className="h-10 w-10 mt-1" />
                        <p className="text-5xl">{countQuery.data?.entreeCount ?? ""}</p>
                    </div>
                </Link>
                <Link href={"/config/" + guildid} className="aspect-square w-full rounded bg-gray-500/40 flex flex-col justify-between p-4">
                    <p className="text-xl">Statistics</p>
                    <div className="flex items-center gap-2">
                        <ChartBarIcon className="h-10 w-10 mt-1" />
                        <p className="text-5xl">{countQuery.data?.playCount ?? ""}</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default GuildConfigPage
