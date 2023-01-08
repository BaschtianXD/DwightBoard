import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "../../../utils/trpc";

const GuildConfigPage: NextPage = () => {
    const router = useRouter()
    const { guildid } = router.query

    const guild = trpc.discord.guild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    return (
        <div>
            <p>GuildConfigPage: {guildid}</p>
            {guild.data &&
                <div className="flex flex-col">
                    <p>{guild.data.guild.name}</p>
                    <Link href={"/config/" + guildid + "/sounds"}>Sounds: {guild.data.soundCount}</Link>
                    <Link href={"/config/" + guildid + "/announcements"}>Announcements: {guild.data.entreeCount}</Link>
                </div>
            }
        </div>
    )
}

export default GuildConfigPage