

"use client";

import { useState, useEffect } from 'react';
import type { Profile } from '@/types';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { updateUserSubscription } from '@/app/actions/update-user-subscription';
import { refreshUserStatsCache } from '@/app/actions/refresh-user-stats-cache';

interface UpdateSubscriptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile | null;
    onSubscriptionUpdate: () => void; // Callback to refresh data
}

const formSchema = z.object({
    tier: z.enum(['free', 'pro', 'lifetime']),
    expiresAt: z.date().optional().nullable(),
    duration: z.string().optional(),
});

export function UpdateSubscriptionDialog({ isOpen, onClose, profile, onSubscriptionUpdate }: UpdateSubscriptionDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const watchedTier = useWatch({
        control: form.control,
        name: 'tier',
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                tier: profile.subscription_tier as 'free' | 'pro' | 'lifetime' || 'free',
                expiresAt: profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null,
                duration: undefined,
            });
        }
    }, [profile, form, isOpen]); // Reset form when dialog opens or profile changes

    useEffect(() => {
        if (watchedTier === 'free' || watchedTier === 'lifetime') {
            form.setValue('expiresAt', null);
            form.setValue('duration', '');
        }
    }, [watchedTier, form]);

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const monthsString = e.target.value;
        form.setValue('duration', monthsString, { shouldValidate: true });
        
        const months = parseInt(monthsString, 10);
        if (!isNaN(months) && months > 0) {
            const newExpiryDate = addMonths(new Date(), months);
            form.setValue('expiresAt', newExpiryDate, { shouldValidate: true });
        } else {
             form.setValue('expiresAt', null);
        }
    }

    if (!profile) return null;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const result = await updateUserSubscription({
            userId: profile.id,
            tier: values.tier,
            expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
        });

        if (result.success) {
            toast({ variant: 'success', title: 'Subscription Updated', description: `${profile.display_name}'s subscription has been updated.`});
            await refreshUserStatsCache(); // Refresh the cached stats in the DB
            onSubscriptionUpdate(); // Trigger the refetch in the parent component
            onClose();
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Subscription</DialogTitle>
                    <DialogDescription>
                        Modify the subscription tier and expiration date for {profile.display_name || profile.email}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="tier"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subscription Tier</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a tier" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="lifetime">Lifetime</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {watchedTier === 'pro' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Set Duration (in months)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number"
                                                    placeholder="e.g., 1 for one month"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={handleDurationChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expiresAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiration Date (auto-calculated)</FormLabel>
                                            <FormControl>
                                                <DatePicker 
                                                    date={field.value || undefined} 
                                                    setDate={field.onChange}
                                                    placeholder="Set expiration date"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader className="mr-2" />}
                                <span>Save Changes</span>
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
