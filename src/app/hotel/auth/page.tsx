"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ If already logged in, skip auth page
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace("/hotel/setup");
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async () => {
    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);

    let error;
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    }

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      router.push("/hotel/setup");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{isSignUp ? "Sign Up" : "Sign In"}</h1>

      <Label>Email</Label>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <Label>Password</Label>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {isSignUp && (
        <>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </>
      )}

      <Button onClick={handleAuth} disabled={loading} className="w-full">
        {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
      </Button>

      <button
        className="text-sm text-blue-500 w-full text-center"
        onClick={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? "Already have an account? Sign In" : "New user? Sign Up"}
      </button>
    </div>
  );
}
