"use client";

import { useActionState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionFormState } from "@/app/actions";
import { Button } from "@/components/ui/button";

type ActionFormProps = Omit<ComponentProps<"form">, "action"> & {
  action: (state: ActionFormState, formData: FormData) => Promise<ActionFormState>;
};

const initialState: ActionFormState = { error: null };

export function ActionForm({ action, children, className, ...props }: ActionFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className} {...props}>
      {children}
      {state.error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function ActionSubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: ComponentProps<typeof Button> & {
  pendingLabel?: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || disabled} {...props}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
