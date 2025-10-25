
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { GoogleSignInButton } from "../ui/google-signin-button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import Loader from "../ui/loader";
import { useLoading } from "@/context/loading-context";

interface SigninFormProps {
    onOpenLegal: (type: 'terms' | 'privacy') => void;
}

export function SigninForm({ onOpenLegal }: SigninFormProps) {
  const { login } = useAuth();
  const { isLoading } = useLoading();
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <div className="space-y-4 pt-4">
        <GoogleSignInButton onClick={login} disabled={isLoading || !hasAgreed}>
            {isLoading && <Loader />}
            <span>Continue with Google</span>
        </GoogleSignInButton>
        
        <div className="items-top flex space-x-2 justify-center pt-2">
          <Checkbox 
            id="terms1" 
            checked={hasAgreed}
            onCheckedChange={(checked) => setHasAgreed(!!checked)}
            aria-label="Agree to terms and conditions"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="terms1"
              className="text-sm font-normal text-muted-foreground"
            >
              By continuing, you agree to our{' '}
              <button onClick={() => onOpenLegal('terms')} className="underline hover:text-primary transition-colors">Terms of Service</button>
              {' '}and acknowledge reading our{' '}
              <button onClick={() => onOpenLegal('privacy')} className="underline hover:text-primary transition-colors">Privacy Policy</button>.
            </Label>
          </div>
        </div>
    </div>
  );
}
