import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authenticatedApiRequest, getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, User, MapPin, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface StoreRating {
  id: string;
  ratingValue: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface StoreWithRatings {
  id: string;
  name: string;
  address: string;
  ratings: StoreRating[];
  averageRating: number;
}

export default function OwnerDashboard() {
  const { toast } = useToast();

  // Debug authentication
  useEffect(() => {
    const currentUser = getCurrentUser();
    console.log("Owner Dashboard - Current User:", currentUser);
    if (!currentUser || currentUser.role !== 'store_owner') {
      console.warn("Owner dashboard accessed by non-store-owner or unauthenticated user");
    }
  }, []);

  // Fetch store with ratings
  const { data: store, isLoading, error } = useQuery<StoreWithRatings>({
    queryKey: ['/api/stores/my-store'],
    queryFn: async () => {
      try {
        console.log("Fetching store data for owner");
        const res = await authenticatedApiRequest('GET', '/api/stores/my-store');
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Store not found. Please contact an administrator to set up your store.");
          }
          throw new Error(`Failed to fetch store: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Store data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching store:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Handle query error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load store data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = (ratings: StoreRating[]) => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach((rating) => {
      distribution[rating.ratingValue as keyof typeof distribution]++;
    });

    return distribution;
  };

  const getRatingBadge = (rating: number) => {
    if (rating === 5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rating === 4) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rating === 3) return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
    if (rating === 2) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || "Please contact an administrator to set up your store."}
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please refresh the page or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ratingDistribution = getRatingDistribution(store.ratings);
  const totalRatings = store.ratings.length;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" data-testid="owner-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Store Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor your store's ratings and customer feedback</p>
      </div>

      {/* Store Overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900" data-testid="store-name">
                {store.name}
              </h2>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {store.address}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end mb-2">
                {renderStars(Math.round(store.averageRating || 0), "lg")}
                <span className="text-2xl font-bold text-gray-900 ml-3" data-testid="average-rating">
                  {store.averageRating ? store.averageRating.toFixed(1) : '0.0'}
                </span>
              </div>
              <p className="text-sm text-gray-600" data-testid="total-ratings">
                Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          {totalRatings > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[5, 4, 3, 2, 1].map((starCount) => (
                <div key={starCount} className="text-center">
                  <div className="text-lg font-semibold text-gray-900" data-testid={`count-${starCount}-stars`}>
                    {ratingDistribution[starCount as keyof typeof ratingDistribution]}
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(starCount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {starCount} Star{starCount !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {store.ratings.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
              <p className="text-gray-600">Your store hasn't received any ratings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {store.ratings
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((rating) => (
                  <div 
                    key={rating.id} 
                    className="border border-gray-200 rounded-lg p-4"
                    data-testid={`rating-${rating.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rating.user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rating.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRatingBadge(rating.ratingValue)}
                        {renderStars(rating.ratingValue)}
                        <span className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}