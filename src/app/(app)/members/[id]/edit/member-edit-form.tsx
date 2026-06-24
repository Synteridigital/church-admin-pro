"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/ui/FormField";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Plus, Trash2, Search, X } from "lucide-react";

// ─── Constants ───

const EDUCATION_OPTIONS = [
  "", "Kindergarten",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  "College Freshman", "College Sophomore", "College Junior", "College Senior",
  "Trade School/Technical", "Graduate School", "Not in School", "Other",
] as const;

const COMM_OPTIONS = ["Text", "Email", "Phone Call", "WhatsApp", "Other"] as const;

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
}));

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

// ─── Schema ───

const personFieldsSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string(),
  email: z.string(),
  church_email: z.string(),
  phone: z.string(),
  birth_month: z.string(),
  birth_day: z.string(),
  birth_year: z.string(),
  education_level: z.string(),
  education_other: z.string(),
  photo_url: z.string(),
});

const familyItemSchema = z.object({
  mode: z.enum(["new", "existing"]),
  existing_member_id: z.string(),
  ...personFieldsSchema.shape,
});

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", ""]),
  email: z.string(),
  church_email: z.string(),
  phone: z.string(),
  birth_month: z.string(),
  birth_day: z.string(),
  birth_year: z.string(),
  marital_status: z.string(),
  anniversary_date: z.string(),
  education_level: z.string(),
  education_other: z.string(),
  preferred_communication: z.array(z.string()),
  address_street: z.string(),
  address_unit: z.string(),
  address_city: z.string(),
  address_state: z.string(),
  address_zip: z.string(),
  membership_status: z.enum(["active", "visitor", "inactive"]),
  photo_url: z.string(),
  // Family
  spouse: familyItemSchema.optional(),
  has_children: z.string(),
  children: z.array(familyItemSchema),
});

type FormValues = z.infer<typeof schema>;

// ─── Types ───

type MemberData = {
  id: string;
  first_name: string | null; last_name: string | null; full_name: string;
  gender: string | null; email: string | null; church_email: string | null;
  phone: string | null; birth_month: number | null; birth_day: number | null;
  birth_year: number | null; marital_status: string | null; anniversary_date: string | null;
  education_level: string | null; education_other: string | null;
  preferred_communication: string[] | null;
  address_street: string | null; address_unit: string | null; address_city: string | null;
  address_state: string | null; address_zip: string | null;
  membership_status: string; photo_url: string | null;
};

type LinkedPerson = { id: string; fullName: string; photoUrl: string | null };

type Props = {
  member: MemberData;
  existingSpouse: LinkedPerson[];
  existingChildren: LinkedPerson[];
  orgMembers: { id: string; full_name: string }[];
};

const EMPTY_PERSON = {
  mode: "new" as const, existing_member_id: "",
  first_name: "", last_name: "", gender: "",
  email: "", church_email: "", phone: "",
  birth_month: "", birth_day: "", birth_year: "",
  education_level: "", education_other: "", photo_url: "",
};

// ─── Helpers ───

function buildAddressFormatted(v: FormValues): string | null {
  const parts = [v.address_street, v.address_unit || "", v.address_city,
    v.address_state ? `${v.address_state} ${v.address_zip ?? ""}`.trim() : v.address_zip,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function buildPersonPayload(p: { first_name: string; last_name: string; gender: string; email: string; church_email: string; phone: string; birth_month: string; birth_day: string; birth_year: string; education_level: string; education_other: string; photo_url: string }) {
  return {
    first_name: p.first_name, last_name: p.last_name,
    gender: p.gender || null,
    email: p.email?.trim() || null, church_email: p.church_email?.trim() || null,
    phone: p.phone?.trim() || null,
    birth_month: p.birth_month || null, birth_day: p.birth_day || null,
    birth_year: p.birth_year || null,
    education_level: p.education_level || null,
    education_other: p.education_level === "Other" ? (p.education_other || null) : null,
    photo_url: p.photo_url || null,
  };
}

// ─── Sub-components ───

function MemberPicker({ orgMembers, linkedIds, onSelect, onClose }: {
  orgMembers: { id: string; full_name: string }[];
  linkedIds: Set<string>;
  onSelect: (id: string, name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = orgMembers.filter(
    (m) => !linkedIds.has(m.id) && m.full_name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="search" placeholder="Search members…" value={search}
          onChange={(e) => setSearch(e.target.value)} autoFocus
          className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">No matching members</p>
        ) : filtered.slice(0, 20).map((m) => (
          <button key={m.id} type="button" onClick={() => onSelect(m.id, m.full_name)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <MemberAvatar fullName={m.full_name} size="h-7 w-7" textSize="text-[10px]" />
            {m.full_name}
          </button>
        ))}
      </div>
      <button type="button" onClick={onClose} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
}

function PersonFields({ prefix, register, watch, inputCls }: {
  prefix: string;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  watch: (name: string) => string;
  inputCls: string;
}) {
  const eduLevel = watch(`${prefix}.education_level`);
  return (
    <div className="space-y-1">
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <FormField label="First name" htmlFor={`${prefix}.first_name`}>
          <input {...register(`${prefix}.first_name` as keyof FormValues)} className={inputCls} />
        </FormField>
        <FormField label="Last name" htmlFor={`${prefix}.last_name`}>
          <input {...register(`${prefix}.last_name` as keyof FormValues)} className={inputCls} />
        </FormField>
        <FormField label="Gender" htmlFor={`${prefix}.gender`}>
          <select {...register(`${prefix}.gender` as keyof FormValues)} className={inputCls}>
            <option value="">Not specified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </FormField>
      </div>
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
        <FormField label="Birth month" htmlFor={`${prefix}.birth_month`}>
          <select {...register(`${prefix}.birth_month` as keyof FormValues)} className={inputCls}>
            <option value="">Month</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </FormField>
        <FormField label="Birth day" htmlFor={`${prefix}.birth_day`}>
          <select {...register(`${prefix}.birth_day` as keyof FormValues)} className={inputCls}>
            <option value="">Day</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>
        <FormField label="Birth year" description="Optional">
          <input {...register(`${prefix}.birth_year` as keyof FormValues)} className={inputCls} placeholder="e.g. 1990" maxLength={4} />
        </FormField>
      </div>
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <FormField label="Personal email">
          <input type="email" {...register(`${prefix}.email` as keyof FormValues)} className={inputCls} />
        </FormField>
        <FormField label="Church email">
          <input type="email" {...register(`${prefix}.church_email` as keyof FormValues)} className={inputCls} />
        </FormField>
        <FormField label="Phone">
          <input {...register(`${prefix}.phone` as keyof FormValues)} className={inputCls} />
        </FormField>
      </div>
      <FormField label="Education level">
        <select {...register(`${prefix}.education_level` as keyof FormValues)} className={inputCls}>
          {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
        </select>
      </FormField>
      {eduLevel === "Other" && (
        <FormField label="Please specify">
          <input {...register(`${prefix}.education_other` as keyof FormValues)} className={inputCls} />
        </FormField>
      )}
    </div>
  );
}

// ─── Main Form ───

export default function MemberEditForm({ member, existingSpouse, existingChildren, orgMembers }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Track removals of already-linked family
  const [spouseToRemove, setSpouseToRemove] = useState<LinkedPerson[]>([]);
  const [childrenToRemove, setChildrenToRemove] = useState<LinkedPerson[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<{ person: LinkedPerson; type: "spouse" | "child" } | null>(null);

  // Track which existing-linked are still present (not removed)
  const activeSpouse = existingSpouse.filter((s) => !spouseToRemove.some((r) => r.id === s.id));
  const activeChildren = existingChildren.filter((c) => !childrenToRemove.some((r) => r.id === c.id));

  const hasExistingSpouse = activeSpouse.length > 0;

  const {
    register, handleSubmit, control, setValue, getValues, watch: watchFn,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: member.first_name ?? "", last_name: member.last_name ?? "",
      gender: (member.gender as "male" | "female" | "") ?? "",
      email: member.email ?? "", church_email: member.church_email ?? "",
      phone: member.phone ?? "",
      birth_month: member.birth_month ? String(member.birth_month) : "",
      birth_day: member.birth_day ? String(member.birth_day) : "",
      birth_year: member.birth_year ? String(member.birth_year) : "",
      marital_status: member.marital_status ?? "",
      anniversary_date: member.anniversary_date ?? "",
      education_level: member.education_level ?? "",
      education_other: member.education_other ?? "",
      preferred_communication: member.preferred_communication ?? [],
      address_street: member.address_street ?? "",
      address_unit: member.address_unit ?? "",
      address_city: member.address_city ?? "",
      address_state: member.address_state ?? "",
      address_zip: member.address_zip ?? "",
      membership_status: member.membership_status as "active" | "visitor" | "inactive",
      photo_url: member.photo_url ?? "",
      spouse: undefined,
      has_children: "no",
      children: [],
    },
  });

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({ control, name: "children" });

  const maritalStatus = useWatch({ control, name: "marital_status" });
  const eduLevel = useWatch({ control, name: "education_level" });
  const photoUrl = useWatch({ control, name: "photo_url" });
  const hasChildren = useWatch({ control, name: "has_children" });
  const spouseMode = useWatch({ control, name: "spouse.mode" });

  const isMarried = maritalStatus === "married";

  // Build linked IDs set for picker exclusion
  const linkedIds = useMemo(() => {
    const ids = new Set([member.id, ...activeSpouse.map((s) => s.id), ...activeChildren.map((c) => c.id)]);
    return ids;
  }, [member.id, activeSpouse, activeChildren]);

  // Show spouse picker state
  const [showSpousePicker, setShowSpousePicker] = useState(false);
  const [selectedSpouseName, setSelectedSpouseName] = useState("");

  function handleConfirmRemove() {
    if (!confirmRemove) return;
    if (confirmRemove.type === "spouse") {
      setSpouseToRemove((prev) => [...prev, confirmRemove.person]);
    } else {
      setChildrenToRemove((prev) => [...prev, confirmRemove.person]);
    }
    setConfirmRemove(null);
  }

  async function onSubmit(values: FormValues) {
    const fullName = `${values.first_name} ${values.last_name}`.trim();
    const married = values.marital_status === "married";

    // 1. Update the member's own fields
    const { error: updateErr } = await supabase
      .from("members")
      .update({
        first_name: values.first_name, last_name: values.last_name, full_name: fullName,
        gender: values.gender || null,
        email: values.email.trim() || null, church_email: values.church_email.trim() || null,
        phone: values.phone.trim() || null,
        birth_month: values.birth_month ? parseInt(values.birth_month) : null,
        birth_day: values.birth_day ? parseInt(values.birth_day) : null,
        birth_year: values.birth_year ? parseInt(values.birth_year) : null,
        marital_status: values.marital_status || null,
        anniversary_date: married && values.anniversary_date ? values.anniversary_date : null,
        education_level: values.education_level || null,
        education_other: values.education_level === "Other" ? (values.education_other || null) : null,
        preferred_communication: values.preferred_communication.length ? values.preferred_communication : null,
        address_street: values.address_street || null, address_unit: values.address_unit || null,
        address_city: values.address_city || null, address_state: values.address_state || null,
        address_zip: values.address_zip || null, address_formatted: buildAddressFormatted(values),
        membership_status: values.membership_status, photo_url: values.photo_url || null,
      })
      .eq("id", member.id);

    if (updateErr) { toast.error(updateErr.message); return; }

    // 2. Process removals
    for (const rem of spouseToRemove) {
      const { error } = await supabase.rpc("unlink_relationship", { p_member_id: member.id, p_related_id: rem.id });
      if (error) { toast.error(`Failed to unlink spouse: ${error.message}`); return; }
    }
    for (const rem of childrenToRemove) {
      const { error } = await supabase.rpc("unlink_relationship", { p_member_id: member.id, p_related_id: rem.id });
      if (error) { toast.error(`Failed to unlink child: ${error.message}`); return; }
    }

    // 3. Process new spouse (only if married + no existing spouse + spouse data provided)
    if (married && !hasExistingSpouse && values.spouse) {
      if (values.spouse.mode === "new" && values.spouse.first_name) {
        const { error } = await supabase.rpc("create_and_link_spouse", {
          p_payload: buildPersonPayload(values.spouse),
          p_existing_member: member.id,
        });
        if (error) { toast.error(`Failed to add spouse: ${error.message}`); return; }
      } else if (values.spouse.mode === "existing" && values.spouse.existing_member_id) {
        const { error } = await supabase.rpc("link_spouse", {
          p_member_id: member.id,
          p_spouse_id: values.spouse.existing_member_id,
        });
        if (error) { toast.error(`Failed to link spouse: ${error.message}`); return; }
      }
    }

    // 4. Process new children
    if (hasChildren === "yes") {
      for (const child of values.children) {
        if (child.mode === "new" && child.first_name) {
          const { error } = await supabase.rpc("create_and_link_child", {
            p_payload: buildPersonPayload(child),
            p_parent: member.id,
          });
          if (error) { toast.error(`Failed to add child: ${error.message}`); return; }
        } else if (child.mode === "existing" && child.existing_member_id) {
          const { error } = await supabase.rpc("link_child", {
            p_parent_id: member.id,
            p_child_id: child.existing_member_id,
          });
          if (error) { toast.error(`Failed to link child: ${error.message}`); return; }
        }
      }
    }

    toast.success("Member updated successfully.");
    router.push(`/members/${member.id}`);
    router.refresh();
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
        <PhotoUpload value={photoUrl || null} onChange={(url) => setValue("photo_url", url ?? "")} storagePath={`photos/${member.id}`} />
      </div>

      {/* Personal info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-1">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h2>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="First name" htmlFor="first_name" error={errors.first_name}>
            <input id="first_name" {...register("first_name")} className={inputCls} />
          </FormField>
          <FormField label="Last name" htmlFor="last_name" error={errors.last_name}>
            <input id="last_name" {...register("last_name")} className={inputCls} />
          </FormField>
          <FormField label="Gender" htmlFor="gender">
            <select id="gender" {...register("gender")} className={inputCls}>
              <option value="">Not specified</option><option value="female">Female</option><option value="male">Male</option>
            </select>
          </FormField>
          <FormField label="Status" htmlFor="membership_status">
            <select id="membership_status" {...register("membership_status")} className={inputCls}>
              <option value="active">Active</option><option value="visitor">Visitor</option><option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
          <FormField label="Birth month"><select {...register("birth_month")} className={inputCls}><option value="">Month</option>{MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></FormField>
          <FormField label="Birth day"><select {...register("birth_day")} className={inputCls}><option value="">Day</option>{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select></FormField>
          <FormField label="Birth year" description="Optional"><input {...register("birth_year")} className={inputCls} placeholder="e.g. 1990" maxLength={4} /></FormField>
        </div>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="Personal email"><input type="email" {...register("email")} className={inputCls} /></FormField>
          <FormField label="Church email"><input type="email" {...register("church_email")} className={inputCls} /></FormField>
          <FormField label="Phone"><input {...register("phone")} className={inputCls} /></FormField>
        </div>
        <FormField label="Education level">
          <select {...register("education_level")} className={inputCls}>
            {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
          </select>
        </FormField>
        {eduLevel === "Other" && <FormField label="Please specify"><input {...register("education_other")} className={inputCls} /></FormField>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred communication</label>
          <div className="flex flex-wrap gap-3">
            {COMM_OPTIONS.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" value={opt} {...register("preferred_communication")} className="rounded" /> {opt}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Household + Address */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-1">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Household</h2>
        <FormField label="Marital status">
          <select {...register("marital_status")} className={inputCls}>
            <option value="">Not specified</option><option value="single">Single</option><option value="married">Married</option>
            <option value="widowed">Widowed</option><option value="divorced">Divorced</option><option value="separated">Separated</option>
          </select>
        </FormField>

        {isMarried && (
          <FormField label="Anniversary date">
            <input type="date" {...register("anniversary_date")} className={inputCls} />
          </FormField>
        )}

        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 pt-2">Address</h3>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="Street"><input {...register("address_street")} className={inputCls} /></FormField>
          <FormField label="Apt / Unit"><input {...register("address_unit")} className={inputCls} /></FormField>
          <FormField label="City"><input {...register("address_city")} className={inputCls} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="State"><input {...register("address_state")} className={inputCls} maxLength={2} /></FormField>
            <FormField label="ZIP"><input {...register("address_zip")} className={inputCls} /></FormField>
          </div>
        </div>
      </div>

      {/* Family */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Family</h2>

        {/* Spouse */}
        {isMarried && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Spouse</h3>
            {hasExistingSpouse ? (
              activeSpouse.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2">
                  <a href={`/members/${s.id}`} className="flex items-center gap-2 group flex-1 min-w-0">
                    <MemberAvatar fullName={s.fullName} photoUrl={s.photoUrl} size="h-8 w-8" textSize="text-[10px]" />
                    <span className="text-sm text-gray-700 group-hover:underline truncate">{s.fullName}</span>
                    <span className="text-xs text-gray-400">(linked)</span>
                  </a>
                  <button type="button" onClick={() => setConfirmRemove({ person: s, type: "spouse" })}
                    aria-label={`Remove spouse ${s.fullName}`} className="text-gray-300 hover:text-red-500 p-1">
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => { setValue("spouse", { ...EMPTY_PERSON, mode: "new" }); setShowSpousePicker(false); setSelectedSpouseName(""); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${spouseMode === "new" ? "" : "bg-gray-100 text-gray-600"}`}
                    style={spouseMode === "new" ? { backgroundColor: "var(--brand)", color: "var(--brand-text)" } : undefined}>
                    Add new
                  </button>
                  <button type="button" onClick={() => { setValue("spouse", { ...EMPTY_PERSON, mode: "existing" }); setShowSpousePicker(true); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${spouseMode === "existing" ? "" : "bg-gray-100 text-gray-600"}`}
                    style={spouseMode === "existing" ? { backgroundColor: "var(--brand)", color: "var(--brand-text)" } : undefined}>
                    Link existing
                  </button>
                </div>
                {spouseMode === "new" && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <PersonFields prefix="spouse" register={register} watch={(n) => watchFn(n as keyof FormValues) as string} inputCls={inputCls} />
                  </div>
                )}
                {spouseMode === "existing" && (
                  <>
                    {selectedSpouseName ? (
                      <div className="flex items-center gap-2 py-2">
                        <MemberAvatar fullName={selectedSpouseName} size="h-8 w-8" textSize="text-[10px]" />
                        <span className="text-sm text-gray-700">{selectedSpouseName}</span>
                        <button type="button" onClick={() => { setValue("spouse.existing_member_id", ""); setSelectedSpouseName(""); setShowSpousePicker(true); }}
                          className="text-xs text-gray-400 hover:text-gray-600 ml-2">Change</button>
                      </div>
                    ) : showSpousePicker ? (
                      <MemberPicker orgMembers={orgMembers} linkedIds={linkedIds}
                        onSelect={(id, name) => { setValue("spouse.existing_member_id", id); setSelectedSpouseName(name); setShowSpousePicker(false); }}
                        onClose={() => setShowSpousePicker(false)} />
                    ) : null}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Children */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Children</h3>

          {/* Already-linked children */}
          {activeChildren.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2">
              <a href={`/members/${c.id}`} className="flex items-center gap-2 group flex-1 min-w-0">
                <MemberAvatar fullName={c.fullName} photoUrl={c.photoUrl} size="h-8 w-8" textSize="text-[10px]" />
                <span className="text-sm text-gray-700 group-hover:underline truncate">{c.fullName}</span>
                <span className="text-xs text-gray-400">(linked)</span>
              </a>
              <button type="button" onClick={() => setConfirmRemove({ person: c, type: "child" })}
                aria-label={`Remove child ${c.fullName}`} className="text-gray-300 hover:text-red-500 p-1">
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add more children toggle */}
          <div className="flex gap-4 mt-2 mb-3">
            <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input type="radio" value="yes" {...register("has_children")} /> Add children
            </label>
            {childFields.length === 0 && (
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="radio" value="no" {...register("has_children")} /> No new children
              </label>
            )}
          </div>

          {hasChildren === "yes" && (
            <div className="space-y-4">
              {childFields.map((field, idx) => (
                <ChildRow key={field.id} idx={idx} register={register} watch={watchFn} setValue={setValue}
                  inputCls={inputCls} orgMembers={orgMembers} linkedIds={linkedIds}
                  onRemove={() => removeChild(idx)} />
              ))}
              <button type="button" onClick={() => appendChild(EMPTY_PERSON)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700">
                <Plus size={14} /> Add child
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          style={{ backgroundColor: "var(--brand)", color: "var(--brand-text)" }}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <a href={`/members/${member.id}`} className="text-sm text-gray-500 hover:text-gray-700">Cancel</a>
      </div>

      {/* Confirm remove dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirm removal">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Remove {confirmRemove.type} link?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove the link to <strong>{confirmRemove.person.fullName}</strong>. Their member record will not be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmRemove(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="button" onClick={handleConfirmRemove}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Child Row sub-component ───

function ChildRow({ idx, register, watch, setValue, inputCls, orgMembers, linkedIds, onRemove }: {
  idx: number;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  watch: ReturnType<typeof useForm<FormValues>>["watch"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  inputCls: string;
  orgMembers: { id: string; full_name: string }[];
  linkedIds: Set<string>;
  onRemove: () => void;
}) {
  const mode = watch(`children.${idx}.mode`) as string;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500">Child {idx + 1}</span>
        <button type="button" onClick={onRemove} aria-label={`Remove child ${idx + 1}`} className="text-gray-400 hover:text-red-500 p-1">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => { setValue(`children.${idx}.mode`, "new"); setSelectedName(""); }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${mode === "new" ? "" : "bg-gray-100 text-gray-600"}`}
          style={mode === "new" ? { backgroundColor: "var(--brand)", color: "var(--brand-text)" } : undefined}>
          Add new
        </button>
        <button type="button" onClick={() => { setValue(`children.${idx}.mode`, "existing"); setPickerOpen(true); }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${mode === "existing" ? "" : "bg-gray-100 text-gray-600"}`}
          style={mode === "existing" ? { backgroundColor: "var(--brand)", color: "var(--brand-text)" } : undefined}>
          Link existing
        </button>
      </div>
      {mode === "new" && (
        <PersonFields prefix={`children.${idx}`} register={register} watch={(n) => watch(n as keyof FormValues) as string} inputCls={inputCls} />
      )}
      {mode === "existing" && (
        <>
          {selectedName ? (
            <div className="flex items-center gap-2 py-2">
              <MemberAvatar fullName={selectedName} size="h-8 w-8" textSize="text-[10px]" />
              <span className="text-sm text-gray-700">{selectedName}</span>
              <button type="button" onClick={() => { setValue(`children.${idx}.existing_member_id`, ""); setSelectedName(""); setPickerOpen(true); }}
                className="text-xs text-gray-400 hover:text-gray-600 ml-2">Change</button>
            </div>
          ) : pickerOpen ? (
            <MemberPicker orgMembers={orgMembers} linkedIds={linkedIds}
              onSelect={(id, name) => { setValue(`children.${idx}.existing_member_id`, id); setSelectedName(name); setPickerOpen(false); }}
              onClose={() => setPickerOpen(false)} />
          ) : null}
        </>
      )}
    </div>
  );
}
