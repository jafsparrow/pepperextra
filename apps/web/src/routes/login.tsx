import { createFileRoute } from "@tanstack/react-router"
import { signIn } from "@pepperextra/auth/client"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
})

function RouteComponent() {
  const handleLogin = async () => {
    const { error } = await signIn.email({
      email: "user@example.com",
      password: "password",
    })
  }
  return <div>Hello "/login"!</div>
}
