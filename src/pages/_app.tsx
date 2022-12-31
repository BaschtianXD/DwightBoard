import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";
import Header from "../components/header";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="grow w-screen">
          <Component {...pageProps} />
        </div>

      </div>

    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
