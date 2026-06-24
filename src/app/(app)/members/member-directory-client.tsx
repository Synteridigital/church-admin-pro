"use client";

import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Search, MoreHorizontal, Eye, Pencil } from "lucide-react";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { MemberRow } from "./page";

const col = createColumnHelper<MemberRow>();

function MemberCell({ row }: { row: MemberRow }) {
  return (
    <a href={`/members/${row.id}`} className="flex items-center gap-3 group">
      <MemberAvatar fullName={row.full_name} photoUrl={row.photo_url} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:underline">
          {row.full_name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {row.email ?? (row.profile_id ? "No email" : "Directory only")}
        </p>
      </div>
    </a>
  );
}

function PositionTags({ positions }: { positions: MemberRow["positions"] }) {
  if (!positions.length) {
    return <span className="text-xs text-gray-400">No positions</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {positions.map((p, i) => {
        const isPrimary =
          p.type === "church_leader" || p.type === "director";
        return (
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={
              isPrimary
                ? {
                    backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
                    color: "var(--brand)",
                  }
                : {
                    backgroundColor: "var(--gold-soft)",
                    color: "var(--gold)",
                  }
            }
          >
            {p.title ?? p.type}
          </span>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"
      ? "bg-emerald-500"
      : status === "visitor"
        ? "bg-amber-400"
        : "bg-gray-300";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 capitalize">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function RowActions({ row }: { row: MemberRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Actions for ${row.full_name}`}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <a
              href={`/members/${row.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye size={14} className="text-gray-400" />
              View profile
            </a>
            <a
              href={`/members/${row.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} className="text-gray-400" />
              Edit
            </a>
          </div>
        </>
      )}
    </div>
  );
}

const columns = [
  col.display({
    id: "member",
    header: "Member",
    cell: ({ row }) => <MemberCell row={row.original} />,
    enableSorting: true,
  }),
  col.display({
    id: "positions",
    header: "Positions",
    cell: ({ row }) => <PositionTags positions={row.original.positions} />,
  }),
  col.accessor("membership_status", {
    header: "Status",
    cell: ({ getValue }) => <StatusDot status={getValue()} />,
  }),
  col.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <RowActions row={row.original} />,
  }),
];

type Props = {
  members: MemberRow[];
  isSuperAdmin: boolean;
};

type GenderFilter = "all" | "female" | "male";

export default function MemberDirectoryClient({
  members,
  isSuperAdmin,
}: Props) {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");

  const filtered =
    genderFilter === "all"
      ? members
      : members.filter((m) => m.gender === genderFilter);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Member Directory
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isSuperAdmin && (
          <a
            href="/members/intake"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: "var(--brand)",
              color: "var(--brand-text)",
            }}
          >
            Add member
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "female", "male"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={
                genderFilter === g
                  ? {
                      backgroundColor: "var(--brand)",
                      color: "var(--brand-text)",
                    }
                  : {
                      backgroundColor: "#f3f4f6",
                      color: "#4b5563",
                    }
              }
            >
              {g === "all" ? "All" : g === "female" ? "Women" : "Men"}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} globalFilter={search} />
    </>
  );
}
