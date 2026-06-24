"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

// ─── Shared constants ───

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

const personSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birth_month: z.string().min(1, "Month is required"),
  birth_day: z.string().min(1, "Day is required"),
  birth_year: z.string(),
  email: z.string(),
  phone: z.string(),
  education_level: z.string(),
  education_other: z.string(),
});

const spouseSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birth_month: z.string(),
  birth_day: z.string(),
  birth_year: z.string(),
  email: z.string(),
  phone: z.string(),
  education_level: z.string(),
  education_other: z.string(),
  preferred_communication: z.array(z.string()),
});

const childSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birth_month: z.string(),
  birth_day: z.string(),
  birth_year: z.string(),
  email: z.string(),
  phone: z.string(),
  education_level: z.string(),
  education_other: z.string(),
});

const formSchema = z.object({
  // Primary person
  ...personSchema.shape,
  church_email: z.string(),
  preferred_communication: z.array(z.string()),
  // Household only
  marital_status: z.string(),
  anniversary_date: z.string(),
  // Spouse (conditional)
  spouse: spouseSchema.optional(),
  // Address (self/household)
  address_street: z.string(),
  address_unit: z.string(),
  address_city: z.string(),
  address_state: z.string(),
  address_zip: z.string(),
  // Children
  has_children: z.string(),
  children: z.array(childSchema),
});

type FormValues = z.infer<typeof formSchema>;

type IntakeMode = "self" | "household" | "child";

const EMPTY_CHILD = {
  first_name: "", last_name: "", birth_month: "", birth_day: "", birth_year: "",
  email: "", phone: "", education_level: "", education_other: "",
};

// ─── Component ───

export default function IntakeForm({ mode, orgId }: { mode: IntakeMode; orgId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isChild = mode === "child";
  const isHousehold = mode === "household";

  const {
    register, handleSubmit, watch, control, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "", last_name: "",
      birth_month: "", birth_day: "", birth_year: "",
      email: "", church_email: "", phone: "",
      education_level: "", education_other: "",
      preferred_communication: [],
      marital_status: "", anniversary_date: "",
      spouse: undefined,
      address_street: "", address_unit: "", address_city: "", address_state: "", address_zip: "",
      has_children: "no",
      children: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "children" });
  const maritalStatus = watch("marital_status");
  const hasChildren = watch("has_children");
  const eduLevel = watch("education_level");
  const spouseEduLevel = watch("spouse.education_level");
  const isMarried = maritalStatus === "married";

  function buildAddressFormatted(v: FormValues): string | null {
    const parts = [
      v.address_street,
      v.address_unit ? `${v.address_unit}` : "",
      v.address_city,
      v.address_state ? `${v.address_state} ${v.address_zip ?? ""}`.trim() : v.address_zip,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }

  async function onSubmit(values: FormValues) {
    const payload: Record<string, unknown> = {
      first_name: values.first_name,
      last_name: values.last_name,
      birth_month: values.birth_month || null,
      birth_day: values.birth_day || null,
      birth_year: values.birth_year || null,
      email: values.email || null,
      phone: values.phone || null,
      education_level: values.education_level || null,
      education_other: values.education_level === "Other" ? (values.education_other || null) : null,
      submission_type: mode,
    };

    if (!isChild) {
      payload.church_email = values.church_email || null;
      payload.preferred_communication = values.preferred_communication.length
        ? values.preferred_communication
        : null;
      payload.marital_status = values.marital_status || null;
      payload.anniversary_date = isMarried ? (values.anniversary_date || null) : null;
      payload.address_street = values.address_street || null;
      payload.address_unit = values.address_unit || null;
      payload.address_city = values.address_city || null;
      payload.address_state = values.address_state || null;
      payload.address_zip = values.address_zip || null;
      payload.address_formatted = buildAddressFormatted(values);

      if (isMarried && values.spouse?.first_name) {
        payload.spouse = {
          first_name: values.spouse.first_name,
          last_name: values.spouse.last_name,
          birth_month: values.spouse.birth_month || null,
          birth_day: values.spouse.birth_day || null,
          birth_year: values.spouse.birth_year || null,
          email: values.spouse.email || null,
          phone: values.spouse.phone || null,
          education_level: values.spouse.education_level || null,
          education_other: values.spouse.education_level === "Other"
            ? (values.spouse.education_other || null) : null,
          preferred_communication: values.spouse.preferred_communication?.length
            ? values.spouse.preferred_communication : null,
        };
      }

      if (hasChildren === "yes" && values.children.length > 0) {
        payload.children = values.children.map((c) => ({
          first_name: c.first_name,
          last_name: c.last_name,
          birth_month: c.birth_month || null,
          birth_day: c.birth_day || null,
          birth_year: c.birth_year || null,
          email: c.email || null,
          phone: c.phone || null,
          education_level: c.education_level || null,
          education_other: c.education_level === "Other" ? (c.education_other || null) : null,
        }));
      }
    }

    const { data, error } = await supabase.rpc("handle_household_intake", {
      p_payload: payload,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    const result = data as { ok: boolean } | null;
    if (!result?.ok) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success("Registration submitted successfully.");
    router.push("/members");
    router.refresh();
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200";
  const sectionCls = "rounded-2xl border border-gray-200 bg-white p-6 space-y-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h2>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="First name" htmlFor="first_name" error={errors.first_name}>
            <input id="first_name" {...register("first_name")} className={inputCls} />
          </FormField>
          <FormField label="Last name" htmlFor="last_name" error={errors.last_name}>
            <input id="last_name" {...register("last_name")} className={inputCls} />
          </FormField>
        </div>

        {/* DOB */}
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
          <FormField label="Birth month" htmlFor="birth_month" error={errors.birth_month}>
            <select id="birth_month" {...register("birth_month")} className={inputCls}>
              <option value="">Month</option>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </FormField>
          <FormField label="Birth day" htmlFor="birth_day" error={errors.birth_day}>
            <select id="birth_day" {...register("birth_day")} className={inputCls}>
              <option value="">Day</option>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Birth year" htmlFor="birth_year" description="Optional">
            <input id="birth_year" {...register("birth_year")} className={inputCls} placeholder="e.g. 1990" maxLength={4} />
          </FormField>
        </div>

        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="Personal email" htmlFor="email">
            <input id="email" type="email" {...register("email")} className={inputCls} />
          </FormField>
          {!isChild && (
            <FormField label="Church email" htmlFor="church_email">
              <input id="church_email" type="email" {...register("church_email")} className={inputCls} />
            </FormField>
          )}
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" {...register("phone")} className={inputCls} placeholder="+1 (555) 000-0000" />
          </FormField>
        </div>

        <FormField label={isChild ? "Grade / Education level" : "Are you currently a student?"} htmlFor="education_level">
          <select id="education_level" {...register("education_level")} className={inputCls}>
            {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
          </select>
        </FormField>
        {eduLevel === "Other" && (
          <FormField label="Please specify" htmlFor="education_other">
            <input id="education_other" {...register("education_other")} className={inputCls} />
          </FormField>
        )}

        {!isChild && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred communication</label>
            <div className="flex flex-wrap gap-3">
              {COMM_OPTIONS.map((opt) => (
                <label key={opt} className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" value={opt} {...register("preferred_communication")} className="rounded" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Household section (self & household only) */}
      {!isChild && (
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Household Information</h2>

          <FormField label="Marital status" htmlFor="marital_status">
            <div className="flex flex-wrap gap-3 mt-1">
              {["single", "married", "widowed", "divorced", "separated"].map((s) => (
                <label key={s} className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer capitalize">
                  <input type="radio" value={s} {...register("marital_status")} />
                  {s}
                </label>
              ))}
            </div>
          </FormField>

          {isMarried && (
            <FormField label="Anniversary date" htmlFor="anniversary_date">
              <input id="anniversary_date" type="date" {...register("anniversary_date")} className={inputCls} />
            </FormField>
          )}

          {/* Address */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Home Address</h3>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <FormField label="Street" htmlFor="address_street">
                <input id="address_street" {...register("address_street")} className={inputCls} placeholder="123 Main St" />
              </FormField>
              <FormField label="Apt / Unit" htmlFor="address_unit">
                <input id="address_unit" {...register("address_unit")} className={inputCls} placeholder="Apt 4B" />
              </FormField>
              <FormField label="City" htmlFor="address_city">
                <input id="address_city" {...register("address_city")} className={inputCls} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="State" htmlFor="address_state">
                  <input id="address_state" {...register("address_state")} className={inputCls} placeholder="MD" maxLength={2} />
                </FormField>
                <FormField label="ZIP" htmlFor="address_zip">
                  <input id="address_zip" {...register("address_zip")} className={inputCls} placeholder="20901" />
                </FormField>
              </div>
            </div>
          </div>

          {/* Spouse */}
          {isMarried && (
            <div className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Spouse</h3>
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <FormField label="First name" htmlFor="spouse.first_name" error={errors.spouse?.first_name}>
                  <input id="spouse.first_name" {...register("spouse.first_name")} className={inputCls} />
                </FormField>
                <FormField label="Last name" htmlFor="spouse.last_name" error={errors.spouse?.last_name}>
                  <input id="spouse.last_name" {...register("spouse.last_name")} className={inputCls} />
                </FormField>
              </div>
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
                <FormField label="Birth month" htmlFor="spouse.birth_month">
                  <select id="spouse.birth_month" {...register("spouse.birth_month")} className={inputCls}>
                    <option value="">Month</option>
                    {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Birth day" htmlFor="spouse.birth_day">
                  <select id="spouse.birth_day" {...register("spouse.birth_day")} className={inputCls}>
                    <option value="">Day</option>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Birth year" htmlFor="spouse.birth_year" description="Optional">
                  <input id="spouse.birth_year" {...register("spouse.birth_year")} className={inputCls} placeholder="e.g. 1988" maxLength={4} />
                </FormField>
              </div>
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <FormField label="Phone" htmlFor="spouse.phone">
                  <input id="spouse.phone" {...register("spouse.phone")} className={inputCls} />
                </FormField>
                <FormField label="Email" htmlFor="spouse.email">
                  <input id="spouse.email" type="email" {...register("spouse.email")} className={inputCls} />
                </FormField>
              </div>
              <FormField label="Grade / Education" htmlFor="spouse.education_level">
                <select id="spouse.education_level" {...register("spouse.education_level")} className={inputCls}>
                  {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
                </select>
              </FormField>
              {spouseEduLevel === "Other" && (
                <FormField label="Please specify" htmlFor="spouse.education_other">
                  <input id="spouse.education_other" {...register("spouse.education_other")} className={inputCls} />
                </FormField>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred communication</label>
                <div className="flex flex-wrap gap-3">
                  {COMM_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" value={opt} {...register("spouse.preferred_communication")} className="rounded" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Children */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Children</h3>
            <div className="flex gap-4 mb-3">
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="radio" value="yes" {...register("has_children")} /> Yes
              </label>
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="radio" value="no" {...register("has_children")} /> No
              </label>
            </div>

            {hasChildren === "yes" && (
              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <div key={field.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">Child {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        aria-label={`Remove child ${idx + 1}`}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      <FormField label="First name" htmlFor={`children.${idx}.first_name`} error={errors.children?.[idx]?.first_name}>
                        <input {...register(`children.${idx}.first_name`)} className={inputCls} />
                      </FormField>
                      <FormField label="Last name" htmlFor={`children.${idx}.last_name`} error={errors.children?.[idx]?.last_name}>
                        <input {...register(`children.${idx}.last_name`)} className={inputCls} />
                      </FormField>
                    </div>
                    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
                      <FormField label="Birth month">
                        <select {...register(`children.${idx}.birth_month`)} className={inputCls}>
                          <option value="">Month</option>
                          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Birth day">
                        <select {...register(`children.${idx}.birth_day`)} className={inputCls}>
                          <option value="">Day</option>
                          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Birth year" description="Optional">
                        <input {...register(`children.${idx}.birth_year`)} className={inputCls} placeholder="e.g. 2015" maxLength={4} />
                      </FormField>
                    </div>
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      <FormField label="Phone">
                        <input {...register(`children.${idx}.phone`)} className={inputCls} />
                      </FormField>
                      <FormField label="Email">
                        <input {...register(`children.${idx}.email`)} className={inputCls} />
                      </FormField>
                    </div>
                    <FormField label="Grade / Education">
                      <select {...register(`children.${idx}.education_level`)} className={inputCls}>
                        {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
                      </select>
                    </FormField>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => append(EMPTY_CHILD)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  <Plus size={14} /> Add child
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          style={{ backgroundColor: "var(--brand)", color: "var(--brand-text)" }}
        >
          {isSubmitting ? "Submitting…" : "Submit registration"}
        </button>
        <a href="/members/intake" className="text-sm text-gray-500 hover:text-gray-700">Cancel</a>
      </div>
    </form>
  );
}
