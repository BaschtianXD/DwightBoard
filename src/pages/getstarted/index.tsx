import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import type { FC } from "react";

const GetStartedPage: NextPage = () => {
    return (
        <div className="min-h-full flex flex-col items-center justify-center gap-4 p-2">
            <Head>
                <title>Dwight - Getting Started</title>
            </Head>

            <div><p className="font-bold dark:text-slate-300 text-3xl">Get Started</p></div>
            <StepBox headline="Step 1: Add Dwight to your server">
                <p>Click on the following link and add Dwight to a server you own</p>
                <div className="w-full flex flex-row items-center justify-center mt-4">
                    <a className="p-2 border-2 hover:text-slate-50 bg-slate-700 rounded" href="https://discord.com/api/oauth2/authorize?client_id=609005073531404304&permissions=2184309776&scope=bot%20applications.commands" target="_blank" rel="noreferrer">Add to Server</a>
                </div>

            </StepBox>
            <StepBox headline="Step 2: Add Sounds">
                <p className="text-xs">Login with Discord required</p>
                <p>Go to Setup, select the server you added Dwight to and go to Sounds. There you can add Sounds.</p>
            </StepBox>
            <StepBox headline="Step 3: Enjoy">
                <p>Dwight automatically creates a channel with a button for each sound. When pressing a button, Dwight joins your voice channel and plays the requested sound.</p>
            </StepBox>
            <StepBox headline="Additional Features">
                <ul className="list-disc list-inside">
                    <li>Implicit rights to play sounds via channel rights</li>
                    <li>Announcement sounds. Play a sounds when someone joins a voice channel</li>
                </ul>
            </StepBox>
            <Link href="/">Back</Link>
        </div>
    )
}

export default GetStartedPage

type StepBoxProps = {
    headline: string,
    children?: React.ReactNode
}

const StepBox: FC<StepBoxProps> = (props) => {
    return (
        <div className="p-2 border-4 rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <p className="text-lg mb-2">{props.headline}</p>
            {props.children}
        </div>
    )
}