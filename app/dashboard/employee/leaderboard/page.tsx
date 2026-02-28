"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  departmentId: string;
  departmentName: string;
  score: number;
  totalXP: number;
  employeeCount: number;
  averageXP: number;
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const PODIUM_STYLES: Record<number, string> = {
  1: "from-yellow-400 via-amber-300 to-yellow-500 shadow-amber-200",
  2: "from-gray-300 via-slate-200 to-gray-400 shadow-gray-200",
  3: "from-orange-400 via-amber-600 to-orange-500 shadow-orange-200",
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/game/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .catch(() => setError("Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏆</div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const maxScore = leaderboard.length > 0 ? leaderboard[0].score : 1;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Department Leaderboard</h1>
        <p className="text-gray-500">Departments ranked by total green skills XP</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-gray-400 text-lg">No scores yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Complete assessments to start earning XP for your department!
          </p>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 mb-10">
              {/* 2nd place */}
              {top3.length >= 2 && (
                <PodiumCard entry={top3[1]} height="h-36" maxScore={maxScore} />
              )}
              {/* 1st place */}
              <PodiumCard entry={top3[0]} height="h-48" maxScore={maxScore} />
              {/* 3rd place */}
              {top3.length >= 3 && (
                <PodiumCard entry={top3[2]} height="h-28" maxScore={maxScore} />
              )}
            </div>
          )}

          {/* Full ranking table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Full Rankings
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry) => (
                <LeaderboardRow key={entry.departmentId} entry={entry} maxScore={maxScore} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PodiumCard({ entry, height, maxScore }: { entry: LeaderboardEntry; height: string; maxScore: number }) {
  const medal = MEDALS[entry.rank] || "";
  const style = PODIUM_STYLES[entry.rank] || PODIUM_STYLES[3];
  const isFirst = entry.rank === 1;

  return (
    <div className={`flex flex-col items-center w-40 ${isFirst ? "animate-pulse-slow" : ""}`}>
      <div className={`text-4xl mb-2 ${isFirst ? "animate-bounce" : ""}`}>{medal}</div>
      <div className="text-sm font-bold text-gray-800 text-center mb-1 truncate w-full">
        {entry.departmentName}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {entry.employeeCount} member{entry.employeeCount !== 1 ? "s" : ""}
      </div>
      <div
        className={`w-full ${height} bg-gradient-to-t ${style} rounded-t-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-700`}
      >
        <div className="text-2xl font-extrabold text-white drop-shadow">
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-white/80 mt-1">XP</div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, maxScore }: { entry: LeaderboardEntry; maxScore: number }) {
  const medal = MEDALS[entry.rank];
  const isTop3 = entry.rank <= 3;
  const barWidth = maxScore > 0 ? (entry.score / maxScore) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${
        isTop3 ? "bg-amber-50/30" : ""
      }`}
    >
      {/* Rank */}
      <div className="w-10 text-center">
        {medal ? (
          <span className="text-2xl">{medal}</span>
        ) : (
          <span className="text-lg font-bold text-gray-400">#{entry.rank}</span>
        )}
      </div>

      {/* Department info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isTop3 ? "text-gray-900" : "text-gray-700"}`}>
            {entry.departmentName}
          </span>
          <span className="text-xs text-gray-400">
            {entry.employeeCount} member{entry.employeeCount !== 1 ? "s" : ""}
          </span>
        </div>
        {/* XP bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              isTop3
                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                : "bg-gradient-to-r from-green-400 to-emerald-500"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className={`text-lg font-bold ${isTop3 ? "text-amber-600" : "text-green-600"}`}>
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400">
          avg {entry.averageXP.toLocaleString()} / person
        </div>
      </div>
    </div>
  );
}
