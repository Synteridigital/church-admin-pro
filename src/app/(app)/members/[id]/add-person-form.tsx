"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/ui/FormField";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

const EDUCATION_OPTIONS = [
  "", "Kindergarten",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  "College Freshman", "College Sophomore", "College Junior", "College Senior",
  "Trade School/Technical", "Graduate School", "Not in School", "Other",
] as const;

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
}));

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", ""]),
  email: z.string(),
  church_email: z.string(),
  phone: z.string(),
  birth_month: z.string().min(1, "Month is required"),
  birth_day: z.string().min(1, "Day is required"),
  birth_year: z.string(),
  education_level: z.string(),
  education_other: z.string(),
  photo_url: z.string(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  /** The existing member to link the new person to */
  memberId: string;
  /** "spouse" or "child" */
  role: "spouse" | "child";
};

export default function AddPersonForm({ memberId, role }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "", last_name: "", gender: "",
      email: "", church_email: "", phone: "",
      birth_month: "", birth_day: "", birth_year: "",
      education_level: "", education_other: "",
      photo_url: "",
    },
  });

  const eduLevel = watch("education_level");
  const photoUrl = watch("photo_url");

  async function onSubmit(values: FormValues) {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      gender: values.gender || null,
      email: values.email.trim() || null,
      church_email: values.church_email.trim() || null,
      phone: values.phone.trim() || null,
      birth_month: values.birth_month || null,
      birth_day: values.birth_day || null,
      birth_year: values.birth_year || null,
      education_level: values.education_level || null,
      education_other: values.education_level === "Other" ? (values.education_other || null) : null,
      photo_url: values.photo_url || null,
    };

    const rpcName = role === "spouse" ? "create_and_link_spouse" : "create_and_link_child";
    const rpcParams =
      role === "spouse"
        ? { p_payload: payload, p_existing_member: memberId }
        : { p_payload: payload, p_parent: memberId };

    const { error } = await supabase.rpc(rpcName, rpcParams);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${role === "spouse" ? "Spouse" : "Child"} added and linked successfully.`);
    router.push(`/members/${memberId}`);
    router.refresh();
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
        <PhotoUpload
          value={photoUrl || null}
          onChange={(url) => setValue("photo_url", url ?? "")}
        />
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
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </FormField>
        </div>

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
          <FormField label="Church email" htmlFor="church_email">
            <input id="church_email" type="email" {...register("church_email")} className={inputCls} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" {...register("phone")} className={inputCls} />
          </FormField>
        </div>

        <FormField label="Education level" htmlFor="education_level">
          <select id="education_level" {...register("education_level")} className={inputCls}>
            {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o || "Select…"}</option>)}
          </select>
        </FormField>
        {eduLevel === "Other" && (
          <FormField label="Please specify" htmlFor="education_other">
            <input id="education_other" {...register("education_other")} className={inputCls} />
          </FormField>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          style={{ backgroundColor: "var(--brand)", color: "var(--brand-text)" }}
        >
          {isSubmitting
            ? `Adding ${role}…`
            : `Add ${role}`}
        </button>
        <a href={`/members/${memberId}`} className="text-sm text-gray-500 hover:text-gray-700">Cancel</a>
      </div>
    </form>
  );
}
