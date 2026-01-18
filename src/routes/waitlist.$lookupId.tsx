import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Calendar, Loader2, Mail, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";

export const Route = createFileRoute("/waitlist/$lookupId")({
	component: WaitlistStatus,
});

function WaitlistStatus() {
	const { lookupId } = Route.useParams();
	const position = useQuery(api.waitlist.getWaitlistPosition, { lookupId });

	if (position === undefined) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
					<p className="text-gray-400">Loading your waitlist status...</p>
				</div>
			</div>
		);
	}

	if (position === null) {
		throw notFound();
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "registered":
				return "bg-green-500";
			case "pending":
				return "bg-yellow-500";
			default:
				return "bg-gray-500";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "registered":
				return "Registered with Google";
			case "pending":
				return "Email Confirmation";
			default:
				return "Unknown";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
			<div className="w-full max-w-2xl">
				<Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
					<CardHeader className="text-center pb-8">
						<CardTitle className="text-3xl font-bold text-white mb-2">
							You're on the AI Stack waitlist!
						</CardTitle>
						<p className="text-gray-400">
							Thanks for joining. Here's your current status:
						</p>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Position Badge */}
						<div className="text-center">
							<div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
								<span className="text-4xl font-bold text-white">
									#{position.position}
								</span>
							</div>
							<p className="text-xl text-gray-300">in line</p>
						</div>

						{/* Stats Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-slate-700/50 rounded-lg p-4 text-center">
								<Users className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
								<p className="text-2xl font-bold text-white">
									{position.peopleAhead}
								</p>
								<p className="text-sm text-gray-400">people ahead</p>
							</div>

							<div className="bg-slate-700/50 rounded-lg p-4 text-center">
								<Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
								<p className="text-2xl font-bold text-white">
									{position.totalPeople}
								</p>
								<p className="text-sm text-gray-400">total waiting</p>
							</div>

							<div className="bg-slate-700/50 rounded-lg p-4 text-center">
								<Calendar className="h-6 w-6 text-purple-400 mx-auto mb-2" />
								<p className="text-lg font-bold text-white">
									{position.estimatedTimeline}
								</p>
								<p className="text-sm text-gray-400">estimated access</p>
							</div>
						</div>

						{/* Status and Email */}
						<div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-700/30 rounded-lg p-4">
							<div className="flex items-center gap-3">
								<span
									className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${getStatusColor(position.status)}`}
								>
									{getStatusText(position.status)}
								</span>
							</div>

							<div className="flex items-center gap-2 text-gray-400">
								<Mail className="h-4 w-4" />
								<span className="text-sm">{position.email}</span>
							</div>
						</div>

						{/* Info Message */}
						<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
							<p className="text-blue-400 text-sm text-center">
								We'll send you an update when your spot is ready.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
