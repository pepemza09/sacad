import { useState, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/auth/AuthContext";
import { apiClient } from "../../api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(user?.foto || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("foto", file);

    setUploading(true);
    try {
      const { data } = await apiClient.request<{ foto: string }>({
        method: "PATCH",
        url: "/auth/profile/",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data.foto);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageMeta title="Mi Perfil" description="Editar foto de perfil" />

      <div className="max-w-md mx-auto mt-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">Mi Perfil</h3>

          <div className="flex flex-col items-center gap-4">
            <label className="relative cursor-pointer group">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {preview ? (
                <img
                  src={preview}
                  alt="Foto de perfil"
                  className="w-28 h-28 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-brand-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-200 dark:border-gray-700">
                  {(user?.first_name?.[0] || user?.username?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">
                  {uploading ? "Subiendo..." : "Cambiar foto"}
                </span>
              </div>
            </label>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
