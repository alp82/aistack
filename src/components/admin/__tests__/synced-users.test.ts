import { describe, expect, it } from "vitest";
import { sortSyncedUsers } from "@/components/admin/AdminSyncedUsersTab";
import type { Id } from "../../../../convex/_generated/dataModel";

function user(
	name: string,
	living: boolean,
	lastSyncAt: number,
	creatorId: string,
) {
	return {
		creatorId: creatorId as Id<"creators">,
		name,
		slug: name.toLowerCase(),
		living,
		lastSyncAt,
		syncedStacks: 1,
	};
}

const users = [
	user("Beta", false, 100, "beta"),
	user("Alpha", true, 300, "alpha"),
	user("Gamma", true, 200, "gamma"),
];

describe("sortSyncedUsers", () => {
	it("sorts by newest sync first", () => {
		expect(
			sortSyncedUsers(users, "last_sync", "desc").map((u) => u.name),
		).toEqual(["Alpha", "Gamma", "Beta"]);
	});

	it("sorts by living state and user name", () => {
		expect(sortSyncedUsers(users, "living", "desc").map((u) => u.name)).toEqual(
			["Alpha", "Gamma", "Beta"],
		);
		expect(sortSyncedUsers(users, "name", "asc").map((u) => u.name)).toEqual([
			"Alpha",
			"Beta",
			"Gamma",
		]);
	});
});
