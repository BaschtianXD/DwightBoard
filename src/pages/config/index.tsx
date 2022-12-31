import type { NextPage } from "next";
import Link from "next/link";
import { trpc } from "../../utils/trpc";

const ConfigPage: NextPage = () => {
    const guilds = trpc.discord.guilds.useQuery()
    return (
        <div>
            {guilds.isLoading && <p>Loading ...</p>}
            <p>Select the server you want to configure Dwight for.</p>
            {guilds.data && guilds.data.length > 0 &&
                <div>
                    <ul>
                        {guilds.data.map(guild => { return (<li key={guild.id}><Link href={"/config/" + guild.id}>{guild.name}</Link></li>) })}
                    </ul>
                    <p>Missing a server? Add Dwight to it and come back here.</p>
                </div>
            }
            {guilds.data && guilds.data.length === 0 &&
                <p>It seems like Dwight is not on any server you own. Add Dwight to one of your servers and come back here.</p>
            }


        </div>

    )
}

export default ConfigPage