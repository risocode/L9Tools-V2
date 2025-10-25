
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { updateUserLogo } from '@/app/actions/update-profile-logo';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loader from '@/components/ui/loader';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

interface LogoUploaderProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LogoUploader({ isOpen, onClose }: LogoUploaderProps) {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: "Please select an image smaller than 2MB.",
                });
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            // This path structure is critical for matching the RLS policies.
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            
            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('user_logos')
                .upload(filePath, file);

            if (uploadError) {
                // This will catch "bucket not found", policy violations, etc.
                throw uploadError;
            }

            // 2. Get public URL
            const { data: urlData } = supabase.storage
                .from('user_logos')
                .getPublicUrl(filePath);
            
            if (!urlData.publicUrl) {
                throw new Error("Could not get public URL for the uploaded logo.");
            }
            
            // 3. Update profile with the new URL via server action
            const result = await updateUserLogo(urlData.publicUrl);
            
            if (result.error) {
                throw new Error(result.error);
            }

            toast({
                variant: 'success',
                title: "Logo Updated!",
                description: "Your new logo has been saved.",
            });
            
            await refreshUser();
            handleClose();

        } catch (error: any) {
            console.error("Error uploading logo:", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.message || "An unexpected error occurred. Please try again.",
            });
        } finally {
            // This block will always run, ensuring the loading state is turned off.
            setIsUploading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleClose = () => {
        if (isUploading) return; 
        resetState();
        onClose();
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Custom Logo</DialogTitle>
                    <DialogDescription>
                        Upload a new logo to be displayed in the sidebar. Recommended size: 256x256. Max 2MB.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Input
                        id="logo-upload"
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    
                    {!preview ? (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted hover:border-primary/50 transition-colors"
                            disabled={isUploading}
                        >
                            <UploadCloud className="w-12 h-12 mb-2" />
                            <span>Click to browse or drag & drop</span>
                        </button>
                    ) : (
                        <div className="relative w-48 h-48 mx-auto">
                            <Image
                                src={preview}
                                alt="Logo preview"
                                fill
                                className="object-contain rounded-lg"
                            />
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-7 w-7 rounded-full z-10"
                                onClick={resetState}
                                disabled={isUploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={handleClose} disabled={isUploading}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading && <Loader className="mr-2" />}
                        <span>Upload & Save</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
