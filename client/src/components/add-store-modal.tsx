import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { addStoreFormSchema, type AddStoreFormData } from "@/lib/validation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStoreModal({ isOpen, onClose }: AddStoreModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch store owners
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await authenticatedApiRequest('GET', '/api/admin/users?role=store_owner');
      return res.json();
    },
    enabled: isOpen,
  });

  const form = useForm<AddStoreFormData>({
    resolver: zodResolver(addStoreFormSchema),
    defaultValues: {
      name: "",
      address: "",
      ownerId: "",
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: AddStoreFormData) => {
      const res = await authenticatedApiRequest('POST', '/api/admin/stores', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddStoreFormData) => {
    createStoreMutation.mutate(data);
  };

  // Filter store owners who don't already have a store
  const availableOwners = users?.filter((user: any) => !user.ownedStore) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="add-store-modal">
        <DialogHeader>
          <DialogTitle>Add New Store</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter store name (20-60 characters)"
                      {...field}
                      data-testid="input-store-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter store address (max 400 characters)"
                      rows={3}
                      {...field}
                      data-testid="input-store-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Owner</FormLabel>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-owner">
                          <SelectValue placeholder="Select store owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableOwners.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No available store owners without stores
                          </div>
                        ) : (
                          availableOwners.map((owner: any) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.name} ({owner.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStoreMutation.isPending || availableOwners.length === 0}
                className="flex-1"
                data-testid="button-create-store"
              >
                {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
