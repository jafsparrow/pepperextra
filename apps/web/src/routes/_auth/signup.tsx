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
      Hello "/signup"!
      <Button onClick={handleSignup}> Sign Up</Button>
    </div>
  )
}
