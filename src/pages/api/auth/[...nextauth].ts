import NextAuth, { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db/client";
import { JWT } from "next-auth/jwt/types.js";

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  callbacks: {
    jwt({ token }) {
      console.log("JWT CALLBACK")
      return token
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user.id;
        const discordAccount = await prisma.account.findFirstOrThrow({
          where: {
            provider: "discord",
            userId: user.id
          }
        })
        session.user.discordId = discordAccount.providerAccountId
      }
      return session;
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify+email+guilds", // we also want to see the users guilds
    }),
    // ...add more providers here
  ],
};

export default NextAuth(authOptions);
