import { ChevronRightIcon } from "@heroicons/react/20/solid";
import type { NextPage } from "next";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { LoadingIcon } from "../../components/form";
import { pageClasses } from "../../components/shared";
import { trpc } from "../../utils/trpc";

const ConfigPage: NextPage = () => {
    const guilds = trpc.discord.guilds.useQuery(undefined, { staleTime: 1000 * 10 })

    if (guilds.error) {
        if (guilds.error.data?.code === "UNAUTHORIZED") {
            signIn()
        }
    }
    return (
        <div className={pageClasses}>
            <Head>
                <title>
                    Sounds
                </title>
            </Head>

            {/* NAV HEADER */}
            <div className="flex gap-2 items-center m-2">
                <ChevronRightIcon className="h-4" />
                <Link href="/config">Configuration</Link>
            </div>

            {/* PAGE HEADER */}
            <div className="flex flex-row flex-wrap w-full justify-between gap-2">
                <p className="font-bold text-4xl">Configuration</p>
            </div>
            <p>Here are your servers Dwight is on.</p>
            {guilds.isLoading &&
                <div className="w-full grow flex flex-row items-center justify-around">
                    <LoadingIcon className="w-10 h-10" />
                </div>
            }

            {guilds.data && guilds.data.guilds.size > 0 &&
                <div className="flex flex-col w-full gap-6">
                    {Array.from(guilds.data.guilds.values()).map(guild => (
                        <Link key={guild.id} href={"/config/" + guild.id} className="w-full rounded bg-gray-500/40 flex items-center justify-between p-4">
                            <p className="text-xl">{guild.name}</p>
                            <ChevronRightIcon className="w-7 h-7" />
                        </Link>
                    ))}

                </div>
            }

            {guilds.data && guilds.data.guilds.size === 0 &&
                <p>Dwight does not seem to be on one of your servers. How about you add him?</p>
            }


        </div >

    )
}

export default ConfigPage