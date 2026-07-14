import { SignupForm } from "@/feature/auth/ui/components/sign-up-form"

import type { SignupInputType } from "@/feature/auth/ui/components/sign-up-form"

import { signUp } from "@pepperextra/auth/client"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth/signup")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const signUpMutation = useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: Omit<SignupInputType, "confirmPassword">) => {
      await signUp.email({
        email: email,
        name: name,
        password: password,
      })
    },
    onSuccess: () => {
      console.log("logged in succesfully....")
      navigate({ to: "/planets/list" })
    },
    onError: (error) => console.log("erro on sign"),
  })
  return (
    <div>
      <SignupForm
        onSubmit={({ name, email, password }) =>
          signUpMutation.mutate({ name, email, password })
        }
      />
    </div>
  )
}
