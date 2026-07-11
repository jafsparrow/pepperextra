import { SignupForm } from "@/feature/auth/ui/components/sign-up-form"
import { signUp } from "@pepperextra/auth/client"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/_auth/signup")({
  component: RouteComponent,
})

function RouteComponent() {
  const handleSignup = async () => {
    const { error } = await signUp.email({
      email: "user@example.com",
      name: "jafrose",
      password: "password",
    })
  }
  return (
    <div>
      <SignupForm />
    </div>
  )
}
