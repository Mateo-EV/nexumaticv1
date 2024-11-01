import "server-only";
import { unstable_cache } from "next/cache";
import { db } from ".";
import { connections, type Service, services } from "./schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "../session";
import { formatExpiresAt } from "@/lib/utils";

export const getAvailableServicesForUser = unstable_cache(
  async () => {
    const services = await db.query.services.findMany({
      columns: { id: true, name: true, method: true, type: true },
    });

    return services.reduce(
      (acc, curr) => {
        if (curr.type === "action") {
          acc.indexedByType.actions.push(curr);
        } else {
          acc.indexedByType.triggers.push(curr);
        }

        acc.indexedById[curr.id] = curr;

        return acc;
      },
      {
        indexedByType: {
          actions: [],
          triggers: [],
        },
        indexedById: {},
      } as {
        indexedByType: {
          actions: typeof services;
          triggers: typeof services;
        };
        indexedById: Record<string, (typeof services)[number]>;
      },
    );
  },
  ["services"],
  { tags: ["services"] },
);

export async function saveConnection({
  service,
  access_token,
  expires_in,
  refresh_token,
}: {
  service: { name: Service["name"]; method: Service["method"] };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  const session = (await getSession())!;

  const { id: serviceId } = (await db.query.services.findFirst({
    where: and(
      eq(services.name, service.name),
      eq(services.method, service.method),
    ),
    columns: {
      id: true,
    },
  }))!;

  await db
    .insert(connections)
    .values({
      serviceId,
      userId: session.user.id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: formatExpiresAt(expires_in),
    })
    .onConflictDoUpdate({
      target: [connections.userId, connections.serviceId],
      set: {
        accessToken: sql.raw(`excluded.${connections.accessToken.name}`),
        refreshToken: sql.raw(`excluded.${connections.refreshToken.name}`),
        expiresAt: sql.raw(`excluded.${connections.expiresAt.name}`),
      },
    });
}
