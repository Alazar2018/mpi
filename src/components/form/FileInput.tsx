import {
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef, useState } from "react";
import type { InputProps } from "./Input";
import icons from "@/utils/icons";
import axios from "axios";
import { generateAvatar } from "@/utils/avatar";

// Cache for storing blob URLs
const urlCache = new Map<string, string>();

export default function FileInput({
  seed,
  label,
  validation,
  onUpdate,
  name,
  value,
  placeholder = "Upload a file",
}: Omit<InputProps, "password" | "value"> & {seed?: string | null, value?: File | Blob | string | null}) {
  const myForm = useMyForm();

  const [fileInput, setFileInput] = useState<File | Blob | string | null>(value || null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if(value && typeof value === 'string') {
      fetchAndConvertToBlob(value);
    }
  }, [value])

  useEffect(() => {
    if (!value) {
      const avatarUrl = generateAvatar({ name: seed || "User" });
      setFileUrl(avatarUrl);
      return;
    }

    if (typeof value === 'string') {
      if (value.startsWith('blob:')) {
        setFileUrl(value);
        return;
      }

      if (urlCache.has(value)) {
        setFileUrl(urlCache.get(value) || null);
        return;
      }

      fetchAndConvertToBlob(value);
    } else if (value instanceof Blob) {
      const blobUrl = URL.createObjectURL(value);
      setFileUrl(blobUrl);
      urlCache.set(blobUrl, blobUrl);
      updateFormValue(value);
    }
  }, [value]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput !== undefined && onUpdate(watchInput);
  }, [watchInput]);

  const fetchAndConvertToBlob = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(url, {
        responseType: 'blob',
      });
      
      const blob = response.data;
      const blobUrl = URL.createObjectURL(blob);
      
      urlCache.set(url, blobUrl);
      
      setFileUrl(blobUrl);
      updateFormValue(blob);
    } catch (error) {
      console.error('Error fetching file:', error);
      const avatarUrl = generateAvatar({ name: name });
      setFileUrl(avatarUrl);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormValue = (file: File | Blob) => {
    myForm.setValue && myForm.setValue(name, file, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setFileUrl(blobUrl);
      urlCache.set(blobUrl, blobUrl);
      updateFormValue(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className={`text-base ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      
      <div className="relative">
        <div 
          onClick={triggerFileInput}
          className="flex flex-col items-center bg-gray-1 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          {fileUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-24 rounded-full overflow-hidden border-4 border-secondary shadow-md">
                <img 
                  src={fileUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <i 
                  className="*:size-4 text-primary"
                  dangerouslySetInnerHTML={{ __html: icons.upload || '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12V4M8 4L5 7M8 4L11 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }} 
                />
                <span>{isLoading ? "Loading..." : "Change avatar"}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="size-16 rounded-full bg-gray-2/20 flex items-center justify-center">
                <i 
                  className="*:size-8 text-gray-2"
                  dangerouslySetInnerHTML={{ __html: icons.upload || '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12V4M8 4L5 7M8 4L11 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }} 
                />
              </div>
              <span className="text-base text-gray-2 font-medium">{placeholder}</span>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        
        <input
          type="hidden"
          {...myForm.register(name, validation)}
        />
      </div>
      
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm?.errors?.[name]?.message}
        </span>
      )}
    </div>
  );
}
