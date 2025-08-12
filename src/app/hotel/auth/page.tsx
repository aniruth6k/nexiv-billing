"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log("Session found, redirecting to /hotel");
          router.replace("/hotel");
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setChecking(false);
      }
    };
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("Auth state changed to signed in, redirecting to /hotel");
        // Small delay to ensure session is properly set
        setTimeout(() => {
          router.replace("/hotel");
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleAuth = async () => {
    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (!email || !password) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/hotel`
          }
        });

        if (error) {
          console.error("Sign up error:", error.message);
          setErrorMessage(error.message);
          return;
        }

        if (data.user && !data.session) {
          setSuccessMessage("Please check your email to verify your account before signing in.");
        } else if (data.session) {
          console.log("Sign up successful with immediate session");
          // Auth state change handler will redirect
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          console.error("Sign in error:", error.message);
          setErrorMessage(error.message);
          return;
        }

        console.log("Sign in successful");
        // Auth state change handler will redirect
      }
    } catch (error) {
      console.error("Unexpected auth error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create your hotel management account" 
              : "Sign in to your hotel management account"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="text-green-500 text-sm bg-green-50 p-3 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={handleAuth} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>

          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}