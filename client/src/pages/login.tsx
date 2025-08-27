// import { useState } from "react";
// import { Link, useLocation } from "wouter"; // ✅ Using Wouter
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { login } from "@/lib/auth";
// import { useToast } from "@/hooks/use-toast";
// import { loginFormSchema, type LoginFormData } from "@/lib/validation";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// export default function Login() {
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();
//   const [location, setLocation] = useLocation(); // ✅ Correct for Wouter

//   const form = useForm<LoginFormData>({
//     resolver: zodResolver(loginFormSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   const onSubmit = async (data: LoginFormData) => {
//     try {
//       setIsLoading(true);
//       console.log("Attempting login with:", { email: data.email });

//       const response = await login(data.email, data.password);
//       console.log("Login response:", response);

//       if (!response || !response.user) {
//         throw new Error("Invalid login response - no user data received");
//       }

//       const { user } = response;

//       if (!user.role) {
//         throw new Error("Invalid login response - no user role found");
//       }

//       toast({
//         title: "Success",
//         description: `Welcome back, ${user.name || user.email}!`,
//       });

//       console.log("User role:", user.role);

//       await new Promise(resolve => setTimeout(resolve, 100));

//       switch (user.role) {
//         case "admin":
//           setLocation("/admin");
//           break;
//         case "store_owner":
//           setLocation("/owner");
//           break;
//         case "user":
//           setLocation("/stores");
//           break;
//         default:
//           setLocation("/stores");
//       }

//       window.dispatchEvent(new Event("storage"));
//     } catch (error: any) {
//       console.error("Login error:", error);
//       toast({
//         title: "Error",
//         description: error.message || "Login failed. Please check your credentials.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <CardTitle className="text-3xl font-bold">Sign in to your account</CardTitle>
//           <CardDescription>
//             Or{" "}
//             <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
//               create a new account
//             </Link>
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email Address</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="email"
//                         placeholder="Email address"
//                         {...field}
//                         disabled={isLoading}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Password</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="password"
//                         placeholder="Password"
//                         {...field}
//                         disabled={isLoading}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit" className="w-full" disabled={isLoading}>
//                 {isLoading ? "Signing in..." : "Sign in"}
//               </Button>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { loginFormSchema, type LoginFormData } from "@/lib/validation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await login(data.email, data.password);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // Redirect based on role
      if (response.user.role === 'admin') {
        setLocation('/admin');
      } else if (response.user.role === 'store_owner') {
        setLocation('/owner');
      } else {
        setLocation('/stores');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Sign in to your account</CardTitle>
          <CardDescription>
            Or{' '}
            <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
              create a new account
            </Link>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email address"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
