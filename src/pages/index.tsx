import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const hello = trpc.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>Dwight - Discord Bot</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-full flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Dwight - Discord Bot
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="/getstarted"
            >
              <h3 className="text-2xl font-bold">Get Started →</h3>
              <div className="text-lg">
                Step by step guide to use Dwight.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://discord.com/api/oauth2/authorize?client_id=609005073531404304&permissions=2184309776&scope=bot%20applications.commands"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Add Dwight to your server</h3>
              <div className="text-lg">
                You already know the steps and just want to add Dwight to a server? Here you go.
              </div>
            </Link>
          </div>
        </div>
        <div>
          <p>Made with love by <Link className="font-bold" href="https://github.com/BaschtianXD" target="_blank" rel="noreferrer">@BaschtianXD</Link></p>
        </div>
      </main>
    </>
  );
};

export default Home;
