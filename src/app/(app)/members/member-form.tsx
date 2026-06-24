"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/ui/FormField";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female", ""]),
  email: z.string().refine(
    (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    { message: "Enter a valid email" }
  ),
  phone: z.string(),
  birthday: z.string(),
  membership_status: z.enum(["active", "visitor", "inactive"]),
  photo_url: z.string(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  mode: "create" | "edit";
  memberId?: string;
  /** Server-derived org_id — required for create, included in insert payload */
  orgId?: string;
  defaultValues?: Partial<FormValues>;
};

export default function MemberForm({ mode, memberId, orgId, defaultValues }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      gender: "",
      email: "",
      phone: "",
      birthday: "",
      membership_status: "active",
      photo_url: "",
      ...defaultValues,
    },
  });

  const photoUrl = watch("photo_url");

  async function onSubmit(values: FormValues) {
    const row = {
      full_name: values.full_name,
      gender: values.gender || null,
      email: values.email.trim() || null,
      phone: values.phone.trim() || null,
      birthday: values.birthday || null,
      membership_status: values.membership_status,
      photo_url: values.photo_url || null,
    };

    if (mode === "create") {
      if (!orgId) {
        toast.error("Missing organization context.");
        return;
      }
      const { error } = await supabase.from("members").insert({ ...row, org_id: orgId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Member added successfully.");
    } else {
      const { error } = await supabase
        .from("members")
        .update(row)
        .eq("id", memberId!);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Member updated successfully.");
    }

    router.push("/members");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        {/* Photo upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo
          </label>
          <PhotoUpload
            value={photoUrl || null}
            onChange={(url) => setValue("photo_url", url ?? "")}
            storagePath={memberId ? `photos/${memberId}` : undefined}
          />
        </div>

        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="full_name" error={errors.full_name}>
            <input
              id="full_name"
              {...register("full_name")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Jane Doe"
            />
          </FormField>

          <FormField label="Gender" htmlFor="gender" error={errors.gender}>
            <select
              id="gender"
              {...register("gender")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="jane@example.com"
            />
          </FormField>

          <FormField label="Phone" htmlFor="phone" error={errors.phone}>
            <input
              id="phone"
              {...register("phone")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="+1 (555) 000-0000"
            />
          </FormField>

          <FormField label="Birthday" htmlFor="birthday" error={errors.birthday}>
            <input
              id="birthday"
              type="date"
              {...register("birthday")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </FormField>

          <FormField label="Status" htmlFor="membership_status" error={errors.membership_status}>
            <select
              id="membership_status"
              {...register("membership_status")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="active">Active</option>
              <option value="visitor">Visitor</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          style={{
            backgroundColor: "var(--brand)",
            color: "var(--brand-text)",
          }}
        >
          {isSubmitting
            ? mode === "create"
              ? "Adding member…"
              : "Saving…"
            : mode === "create"
              ? "Add member"
              : "Save changes"}
        </button>
        <a
          href="/members"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
