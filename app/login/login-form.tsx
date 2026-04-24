"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { sendMagicLink } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await sendMagicLink(formData);
      if (result.ok) {
        setSentTo(result.email);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (sentTo) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col gap-2 p-6 text-center">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to <span className="font-medium text-foreground">{sentTo}</span>.
            It expires in 60 minutes.
          </p>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <form action={onSubmit} className="flex flex-col gap-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@eatatditch.com"
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Email me a link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
