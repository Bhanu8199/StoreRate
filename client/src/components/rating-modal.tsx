import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    address: string;
  };
  currentRating?: number;
  isEdit?: boolean;
}

export default function RatingModal({
  isOpen,
  onClose,
  store,
  currentRating = 0,
  isEdit = false,
}: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState(currentRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRatingMutation = useMutation({
    mutationFn: async (ratingValue: number) => {
      const res = await authenticatedApiRequest('POST', '/api/ratings', {
        storeId: store.id,
        ratingValue,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
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

  const updateRatingMutation = useMutation({
    mutationFn: async (ratingValue: number) => {
      const res = await authenticatedApiRequest('PUT', `/api/ratings/${store.id}`, {
        ratingValue,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rating updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
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

  const handleSubmit = () => {
    if (selectedRating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (isEdit) {
      updateRatingMutation.mutate(selectedRating);
    } else {
      createRatingMutation.mutate(selectedRating);
    }
  };

  const getRatingText = (rating: number) => {
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[rating] || 'Click to rate';
  };

  const displayRating = hoveredRating || selectedRating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="rating-modal">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Update Rating' : 'Rate Store'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900" data-testid="store-name">
              {store.name}
            </h4>
            <p className="text-sm text-gray-600" data-testid="store-address">
              {store.address}
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Your Rating
            </label>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className="transition-colors focus:outline-none"
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setSelectedRating(rating)}
                  data-testid={`star-${rating}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600" data-testid="rating-text">
              {getRatingText(displayRating)}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRatingMutation.isPending || updateRatingMutation.isPending}
              className="flex-1"
              data-testid="button-submit"
            >
              {createRatingMutation.isPending || updateRatingMutation.isPending
                ? 'Submitting...'
                : isEdit
                ? 'Update Rating'
                : 'Submit Rating'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
