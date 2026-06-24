"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Heart, Baby, Users, X, Plus, Search } from "lucide-react";

type RelPerson = {
  id: string;
  relatedMemberId: string;
  fullName: string;
  photoUrl: string | null;
};

type Props = {
  memberId: string;
  spouseRels: RelPerson[];
  childRels: RelPerson[];
  parentRels: RelPerson[];
  orgMembers: { id: string; full_name: string }[];
  isSuperAdmin: boolean;
};

export default function RelationshipSection({
  memberId,
  spouseRels,
  childRels,
  parentRels,
  orgMembers,
  isSuperAdmin,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [confirmRemove, setConfirmRemove] = useState<{ relatedId: string; name: string; type: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const [showSpousePicker, setShowSpousePicker] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [linking, setLinking] = useState(false);

  // Filter out members already linked
  const linkedIds = new Set([
    memberId,
    ...spouseRels.map((r) => r.relatedMemberId),
    ...childRels.map((r) => r.relatedMemberId),
    ...parentRels.map((r) => r.relatedMemberId),
  ]);

  const filteredMembers = orgMembers.filter(
    (m) => !linkedIds.has(m.id) && m.full_name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  async function handleLinkSpouse(spouseId: string) {
    setLinking(true);
    const { error } = await supabase.rpc("link_spouse", {
      p_member_id: memberId,
      p_spouse_id: spouseId,
    });
    setLinking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Spouse linked successfully.");
    setShowSpousePicker(false);
    setPickerSearch("");
    router.refresh();
  }

  async function handleLinkChild(childId: string) {
    setLinking(true);
    const { error } = await supabase.rpc("link_child", {
      p_parent_id: memberId,
      p_child_id: childId,
    });
    setLinking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Child linked successfully.");
    setShowChildPicker(false);
    setPickerSearch("");
    router.refresh();
  }

  async function handleRemove() {
    if (!confirmRemove) return;
    setRemoving(true);
    const { error } = await supabase.rpc("unlink_relationship", {
      p_member_id: memberId,
      p_related_id: confirmRemove.relatedId,
    });
    setRemoving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Relationship removed.");
    setConfirmRemove(null);
    router.refresh();
  }

  function MemberPicker({
    onSelect,
    onClose,
  }: {
    onSelect: (id: string) => void;
    onClose: () => void;
  }) {
    return (
      <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search members…"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">No matching members</p>
          ) : (
            filteredMembers.slice(0, 20).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                disabled={linking}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <MemberAvatar fullName={m.full_name} size="h-7 w-7" textSize="text-[10px]" />
                {m.full_name}
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => { onClose(); setPickerSearch(""); }}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Family &amp; Relationships
      </h2>

      {/* Spouse */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={14} className="text-gray-400" aria-hidden="true" />
          <span className="text-xs font-medium text-gray-500">Spouse</span>
        </div>
        {spouseRels.length > 0 ? (
          spouseRels.map((rel) => (
            <div key={rel.id} className="flex items-center gap-3 py-1.5">
              <a href={`/members/${rel.relatedMemberId}`} className="flex items-center gap-2 group flex-1 min-w-0">
                <MemberAvatar fullName={rel.fullName} photoUrl={rel.photoUrl} size="h-8 w-8" textSize="text-[10px]" />
                <span className="text-sm text-gray-700 group-hover:underline truncate">{rel.fullName}</span>
              </a>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setConfirmRemove({ relatedId: rel.relatedMemberId, name: rel.fullName, type: "spouse" })}
                  aria-label={`Remove spouse ${rel.fullName}`}
                  className="text-gray-300 hover:text-red-500 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 mb-1">No spouse linked.</p>
        )}
        {isSuperAdmin && spouseRels.length === 0 && !showSpousePicker && (
          <div className="flex items-center gap-3">
            <a
              href={`/members/${memberId}/add-spouse`}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: "var(--brand)" }}
            >
              <Plus size={12} /> Add new spouse
            </a>
            <button
              type="button"
              onClick={() => setShowSpousePicker(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:underline"
            >
              Link existing
            </button>
          </div>
        )}
        {showSpousePicker && (
          <MemberPicker onSelect={handleLinkSpouse} onClose={() => setShowSpousePicker(false)} />
        )}
      </div>

      {/* Children */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Baby size={14} className="text-gray-400" aria-hidden="true" />
          <span className="text-xs font-medium text-gray-500">Children</span>
        </div>
        {childRels.length > 0 ? (
          childRels.map((rel) => (
            <div key={rel.id} className="flex items-center gap-3 py-1.5">
              <a href={`/members/${rel.relatedMemberId}`} className="flex items-center gap-2 group flex-1 min-w-0">
                <MemberAvatar fullName={rel.fullName} photoUrl={rel.photoUrl} size="h-8 w-8" textSize="text-[10px]" />
                <span className="text-sm text-gray-700 group-hover:underline truncate">{rel.fullName}</span>
              </a>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setConfirmRemove({ relatedId: rel.relatedMemberId, name: rel.fullName, type: "child" })}
                  aria-label={`Remove child ${rel.fullName}`}
                  className="text-gray-300 hover:text-red-500 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 mb-1">No children linked.</p>
        )}
        {isSuperAdmin && !showChildPicker && (
          <div className="flex items-center gap-3">
            <a
              href={`/members/${memberId}/add-child`}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: "var(--brand)" }}
            >
              <Plus size={12} /> Add new child
            </a>
            <button
              type="button"
              onClick={() => setShowChildPicker(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:underline"
            >
              Link existing
            </button>
          </div>
        )}
        {showChildPicker && (
          <MemberPicker onSelect={handleLinkChild} onClose={() => setShowChildPicker(false)} />
        )}
      </div>

      {/* Parents (read-only display) */}
      {parentRels.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-gray-400" aria-hidden="true" />
            <span className="text-xs font-medium text-gray-500">Parents</span>
          </div>
          {parentRels.map((rel) => (
            <div key={rel.id} className="flex items-center gap-3 py-1.5">
              <a href={`/members/${rel.relatedMemberId}`} className="flex items-center gap-2 group flex-1 min-w-0">
                <MemberAvatar fullName={rel.fullName} photoUrl={rel.photoUrl} size="h-8 w-8" textSize="text-[10px]" />
                <span className="text-sm text-gray-700 group-hover:underline truncate">{rel.fullName}</span>
              </a>
            </div>
          ))}
        </div>
      )}

      {spouseRels.length === 0 && childRels.length === 0 && parentRels.length === 0 && !isSuperAdmin && (
        <p className="text-sm text-gray-400">No family relationships on file.</p>
      )}

      {/* Confirm remove dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setConfirmRemove(null)}>
          <div
            className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Confirm removal"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-2">Remove relationship?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove the {confirmRemove.type} link between this member and <strong>{confirmRemove.name}</strong>. Both sides of the relationship will be removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
