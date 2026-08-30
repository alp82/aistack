import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";
import { SortDropdown } from "@/components/SortDropdown";
import { api } from "../../../convex/_generated/api";

type SyncedUser = NonNullable<
	FunctionReturnType<typeof api.measured.listSyncedUsers>
>["users"][number];
type SortKey = "last_sync" | "name" | "living";
type SortDirection = "asc" | "desc";

export function sortSyncedUsers(
	users: readonly SyncedUser[],
	sort: SortKey,
	direction: SortDirection,
): SyncedUser[] {
	const sign = direction === "asc" ? 1 : -1;
	return [...users].sort((a, b) => {
		let compared = 0;
		if (sort === "name") compared = a.name.localeCompare(b.name);
		if (sort === "living") compared = Number(a.living) - Number(b.living);
		if (sort === "last_sync") compared = a.lastSyncAt - b.lastSyncAt;
		return compared === 0 ? a.name.localeCompare(b.name) : compared * sign;
	});
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

export function AdminSyncedUsersTab() {
	const data = useQuery(api.measured.listSyncedUsers);
	const [sort, setSort] = useState<SortKey>("last_sync");
	const [direction, setDirection] = useState<SortDirection>("desc");
	const users = useMemo(
		() => sortSyncedUsers(data?.users ?? [], sort, direction),
		[data?.users, sort, direction],
	);

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			<div className="flex flex-col gap-4 border-b-2 border-stroke-strong pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="font-mono text-2xl font-black uppercase tracking-wide text-fg-primary">
						Synced users
					</h1>
					<p className="mt-2 text-sm text-fg-secondary">
						Living means the user synced at least one stack in the last 7 days.
					</p>
				</div>
				<div className="flex items-center gap-2 font-mono">
					<SortDropdown
						options={[
							{ value: "last_sync", label: "Last sync" },
							{ value: "living", label: "Living" },
							{ value: "name", label: "User" },
						]}
						value={sort}
						onChange={setSort}
					/>
					<button
						type="button"
						onClick={() =>
							setDirection((current) => (current === "desc" ? "asc" : "desc"))
						}
						className="flex size-12 items-center justify-center border border-stroke-strong bg-bg-canvas text-fg-muted transition-colors hover:border-accent-lime hover:text-fg-primary"
						aria-label={`Sort ${direction === "desc" ? "ascending" : "descending"}`}
						title={direction === "desc" ? "Descending" : "Ascending"}
					>
						{direction === "desc" ? (
							<ArrowDown className="size-4" />
						) : (
							<ArrowUp className="size-4" />
						)}
					</button>
				</div>
			</div>

			{data === undefined ? (
				<p className="py-10 font-mono text-sm text-fg-muted">Loading...</p>
			) : data === null ? (
				<p className="py-10 font-mono text-sm text-fg-muted">Not available.</p>
			) : users.length === 0 ? (
				<p className="py-10 font-mono text-sm text-fg-muted">
					No users have synced yet.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-left">
						<thead>
							<tr className="border-b border-stroke-strong font-mono text-xs uppercase tracking-wider text-fg-muted">
								<th className="px-3 py-4 font-semibold">User</th>
								<th className="px-3 py-4 font-semibold">Synced stacks</th>
								<th className="px-3 py-4 font-semibold">Living</th>
								<th className="px-3 py-4 font-semibold">Last sync</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr
									key={user.creatorId}
									className="border-b border-stroke-subtle"
								>
									<td className="px-3 py-4">
										<Link
											to="/$creator"
											params={{ creator: `@${user.slug}` }}
											className="font-semibold text-fg-primary hover:text-accent-lime"
										>
											{user.name}
										</Link>
										<p className="mt-1 font-mono text-xs text-fg-muted">
											@{user.slug}
										</p>
									</td>
									<td className="px-3 py-4 font-mono text-sm text-fg-secondary">
										{user.syncedStacks}
									</td>
									<td className="px-3 py-4 font-mono text-xs font-bold uppercase">
										<span
											className={
												user.living ? "text-accent-lime" : "text-fg-muted"
											}
										>
											{user.living ? "Yes" : "No"}
										</span>
									</td>
									<td className="px-3 py-4 text-sm text-fg-secondary">
										<RelativeTime at={user.lastSyncAt} />
										<p className="mt-1 font-mono text-xs text-fg-muted">
											{DATE_FORMAT.format(user.lastSyncAt)}
										</p>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
